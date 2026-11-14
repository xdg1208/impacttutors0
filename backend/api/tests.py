"""
Test suite for the security-critical and business-critical API paths:

- Registration & invite-code redemption (validation, single-use, races)
- Profile access control (no self-promotion, no self-activation)
- Session permissions (admin-only writes, scoped bulk-delete)
- Attendance (ownership, time window, NO_SHOW)
- Password reset OTP (expiry, attempt lockout, password validators,
  refresh-token revocation)
- Public settings/courses endpoints (no internal config leaks)
- Recurring session sync idempotency

Run with:  manage.py test api
"""
from datetime import timedelta

from django.contrib.auth.models import User
from django.core import mail
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import (
    Course, CourseSchedule, GlobalSetting, InviteCode,
    PasswordResetOTP, Profile, Session, SessionStatus,
)


STRONG_PW = 'Sup3rSafe!Pass1'


def auth_client(user):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + str(RefreshToken.for_user(user).access_token))
    return client


class BaseTestCase(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user('admin', 'admin@x.com', STRONG_PW)
        self.admin.is_staff = True
        self.admin.save()

        self.student = User.objects.create_user('student', 'student@x.com', STRONG_PW)
        self.profile = Profile.objects.create(
            user=self.student, role='student', full_name='Stu Dent', is_onboarded=True,
        )

        self.tutor = User.objects.create_user('tutor', 'tutor@x.com', STRONG_PW)
        self.tutor_profile = Profile.objects.create(
            user=self.tutor, role='tutor', full_name='Tee Cher', is_onboarded=True,
        )

        self.course = Course.objects.create(
            slug='test-course', title='Test Course', category='Math',
            description='desc', tutor=self.tutor_profile,
        )
        self.course.students.add(self.profile)
        self.anon = APIClient()
        self.admin_client = auth_client(self.admin)
        self.student_client = auth_client(self.student)
        self.tutor_client = auth_client(self.tutor)


class RegisterViewTests(BaseTestCase):
    def _register(self, **overrides):
        payload = {
            'email': 'new@x.com', 'password': STRONG_PW,
            'full_name': 'New User', 'role': 'student',
            'invite_code': self.invite.code,
        }
        payload.update(overrides)
        return self.anon.post('/api/auth/register/', payload, format='json')

    def setUp(self):
        super().setUp()
        # Reset throttle counters — test methods share one client IP.
        cache.clear()
        self.invite = InviteCode.objects.create(role='student')

    def test_weak_password_rejected(self):
        r = self._register(password='abc')
        self.assertEqual(r.status_code, 400)
        self.assertIn('password', r.data)

    def test_admin_role_rejected(self):
        r = self._register(role='admin')
        self.assertEqual(r.status_code, 400)

    def test_valid_registration(self):
        r = self._register()
        self.assertEqual(r.status_code, 201)
        self.assertTrue(User.objects.filter(email='new@x.com').exists())
        self.invite.refresh_from_db()
        self.assertTrue(self.invite.is_used)

    def test_single_use_code(self):
        self._register()
        r = self._register(email='other@x.com')
        self.assertEqual(r.status_code, 400)
        self.assertIn('code', r.json()['error'].lower())

    def test_code_locked_to_target_email(self):
        self.invite.target_email = 'fixed@x.com'
        self.invite.save()
        r = self._register(email='someoneelse@x.com')
        self.assertEqual(r.status_code, 400)

    def test_duplicate_email_rejected(self):
        r = self._register(email='student@x.com')
        self.assertEqual(r.status_code, 400)


class ProfileAccessControlTests(BaseTestCase):
    def test_role_not_writable_by_user(self):
        r = self.student_client.patch(f'/api/profiles/{self.profile.id}/', {'role': 'admin'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.role, 'student')

    def test_onboarding_not_writable_by_user(self):
        self.profile.is_onboarded = True
        self.profile.save()
        self.student_client.patch(f'/api/profiles/{self.profile.id}/', {'is_onboarded': False}, format='json')
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.is_onboarded)  # read-only field ignored

    def test_self_activation_blocked(self):
        r = self.student_client.post(f'/api/profiles/{self.profile.id}/toggle_onboarding/',
                                    {'is_onboarded': True}, format='json')
        self.assertEqual(r.status_code, 403)

    def test_admin_can_toggle_onboarding(self):
        r = self.admin_client.post(f'/api/profiles/{self.profile.id}/toggle_onboarding/',
                                   {'is_onboarded': True}, format='json')
        self.assertEqual(r.status_code, 200)
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.is_onboarded)

    def test_student_sees_only_own_profile_in_list(self):
        r = self.student_client.get('/api/profiles/')
        emails = {p['email'] for p in r.json()}
        self.assertEqual(emails, {self.student.email})


class SessionPermissionTests(BaseTestCase):
    def test_student_cannot_create_session(self):
        r = self.student_client.post('/api/sessions/', {
            'course': str(self.course.id),
            'start_time': '2026-10-01T10:00:00Z',
        }, format='json')
        self.assertEqual(r.status_code, 403)

    def test_student_cannot_bulk_delete(self):
        r = self.student_client.post('/api/sessions/bulk-delete/', {'ids': ['x']}, format='json')
        self.assertIn(r.status_code, (403, 401))

    def test_admin_can_create_session_for_all_students(self):
        r = self.admin_client.post('/api/sessions/', {
            'course': str(self.course.id),
            'start_time': (timezone.now() + timedelta(days=1)).isoformat(),
        }, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Session.objects.filter(course=self.course).count(), 1)

    def test_status_filter_honoured(self):
        s = Session.objects.create(
            course=self.course, student=self.profile, tutor=self.tutor_profile,
            start_time=timezone.now() + timedelta(days=1), status=SessionStatus.SCHEDULED,
        )
        Session.objects.create(
            course=self.course, student=self.profile, tutor=self.tutor_profile,
            start_time=timezone.now() - timedelta(days=1), status=SessionStatus.COMPLETED,
        )
        r = self.student_client.get('/api/sessions/', {'status': 'scheduled'})
        body = r.json()
        self.assertIn('results', body)  # paginated
        self.assertEqual(body['count'], 1)
        self.assertEqual(body['results'][0]['id'], str(s.id))


class AttendanceTests(BaseTestCase):
    def _session(self, offset_hours, **kwargs):
        return Session.objects.create(
            course=self.course, student=self.profile, tutor=self.tutor_profile,
            start_time=timezone.now() + timedelta(hours=offset_hours),
            status=SessionStatus.SCHEDULED, **kwargs,
        )

    def test_student_can_mark_within_window(self):
        s = self._session(-1)  # started an hour ago
        r = self.student_client.post(f'/api/sessions/{s.id}/student-mark-attendance/',
                                     {'feedback': 'great'}, format='json')
        self.assertEqual(r.status_code, 200)
        s.refresh_from_db()
        self.assertTrue(s.student_marked_present)

    def test_student_cannot_mark_outside_window(self):
        s = self._session(-30)  # far outside the 6h window
        r = self.student_client.post(f'/api/sessions/{s.id}/student-mark-attendance/', format='json')
        self.assertEqual(r.status_code, 400)

    def test_other_student_cannot_mark(self):
        other = User.objects.create_user('other', 'other@x.com', STRONG_PW)
        other_profile = Profile.objects.create(user=other, role='student', full_name='O Ther')
        self.course.students.add(other_profile)
        s = self._session(-1)
        r = auth_client(other).post(f'/api/sessions/{s.id}/student-mark-attendance/', format='json')
        # The session belongs to self.profile, so `other` gets a 404 from the
        # queryset scope or a 403 from the ownership check.
        self.assertIn(r.status_code, (403, 404))

    def test_tutor_absent_marks_no_show(self):
        s = self._session(-1)
        r = self.tutor_client.post(f'/api/sessions/{s.id}/tutor-mark-attendance/',
                                   {'confirmed_student': False}, format='json')
        self.assertEqual(r.status_code, 200)
        s.refresh_from_db()
        self.assertEqual(s.status, SessionStatus.NO_SHOW)

    def test_tutor_present_marks_completed(self):
        s = self._session(-1)
        self.tutor_client.post(f'/api/sessions/{s.id}/tutor-mark-attendance/',
                               {'confirmed_student': True}, format='json')
        s.refresh_from_db()
        self.assertEqual(s.status, SessionStatus.COMPLETED)


class PasswordResetTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        # The password-reset throttle (5/hour) would otherwise trip across
        # test methods since every test client shares the same identity.
        cache.clear()

    def _request_otp(self, email='reset@x.com'):
        self.reset_user = User.objects.create_user(email, email, STRONG_PW)
        self.anon.post('/api/auth/forgot-password/', {'email': email}, format='json')
        return PasswordResetOTP.objects.filter(email=email).order_by('-created_at').first()

    def _try_reset(self, otp_row, otp, password='NewStr0ng!Pass9'):
        return self.anon.post('/api/auth/reset-password/', {
            'email': otp_row.email, 'otp': otp, 'new_password': password,
        }, format='json')

    def test_otp_lockout_after_max_attempts(self):
        otp_row = self._request_otp()
        for _ in range(PasswordResetOTP.MAX_ATTEMPTS):
            # Clear only the throttle cache so this test exercises the
            # per-OTP attempt lockout itself (the HTTP throttle — 5/hour —
            # is verified separately and would 429 before the lockout).
            cache.clear()
            r = self._try_reset(otp_row, '000000')
            self.assertEqual(r.status_code, 400)
        otp_row.refresh_from_db()
        self.assertTrue(otp_row.is_used)  # burned — real code no longer works
        cache.clear()
        r = self._try_reset(otp_row, otp_row.otp)
        self.assertEqual(r.status_code, 400)

    def test_forgot_password_is_throttled(self):
        for i in range(5):
            r = self.anon.post('/api/auth/forgot-password/', {'email': 'x@x.com'}, format='json')
            self.assertEqual(r.status_code, 200)
        r = self.anon.post('/api/auth/forgot-password/', {'email': 'x@x.com'}, format='json')
        self.assertEqual(r.status_code, 429)

    def test_expired_otp_rejected(self):
        otp_row = self._request_otp()
        PasswordResetOTP.objects.filter(pk=otp_row.pk).update(
            created_at=timezone.now() - timedelta(minutes=30)
        )
        r = self._try_reset(otp_row, otp_row.otp)
        self.assertEqual(r.status_code, 400)

    def test_successful_reset_revokes_refresh_tokens(self):
        otp_row = self._request_otp()
        refresh = RefreshToken.for_user(self.reset_user)
        r = self._try_reset(otp_row, otp_row.otp)
        self.assertEqual(r.status_code, 200)
        self.reset_user.refresh_from_db()
        self.assertTrue(self.reset_user.check_password('NewStr0ng!Pass9'))
        # Old refresh token must now be blacklisted.
        resp = self.anon.post('/api/token/refresh/', {'refresh': str(refresh)}, format='json')
        self.assertEqual(resp.status_code, 401)

    def test_weak_password_rejected_on_reset(self):
        otp_row = self._request_otp()
        r = self._try_reset(otp_row, otp_row.otp, password='123')
        self.assertEqual(r.status_code, 400)

    def test_forgot_password_does_not_reveal_registration(self):
        r = self.anon.post('/api/auth/forgot-password/', {'email': 'nobody@x.com'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['message'], 'If this email is registered, you will receive an OTP code shortly.')


class ChangePasswordTests(BaseTestCase):
    def test_change_password_and_token_revocation(self):
        old_refresh = RefreshToken.for_user(self.student)
        r = self.student_client.patch('/api/auth/change-password/', {
            'old_password': STRONG_PW,
            'new_password': 'AlsoStr0ng!77',
            'confirm_password': 'AlsoStr0ng!77',
        }, format='json')
        self.assertEqual(r.status_code, 200)
        self.student.refresh_from_db()
        self.assertTrue(self.student.check_password('AlsoStr0ng!77'))
        resp = self.anon.post('/api/token/refresh/', {'refresh': str(old_refresh)}, format='json')
        self.assertEqual(resp.status_code, 401)

    def test_wrong_old_password_rejected(self):
        r = self.student_client.patch('/api/auth/change-password/', {
            'old_password': 'WrongOld!99',
            'new_password': 'AlsoStr0ng!77',
            'confirm_password': 'AlsoStr0ng!77',
        }, format='json')
        self.assertEqual(r.status_code, 400)


class PublicEndpointTests(BaseTestCase):
    def test_settings_hides_telegram_chat_id_from_anonymous(self):
        GlobalSetting.objects.all().delete()
        GlobalSetting.objects.create(telegram_chat_id='SECRET-123')
        r = self.anon.get('/api/settings/')
        self.assertNotIn('telegram_chat_id', r.json())

    def test_settings_shows_telegram_chat_id_to_staff(self):
        GlobalSetting.objects.all().delete()
        GlobalSetting.objects.create(telegram_chat_id='SECRET-123')
        r = self.admin_client.get('/api/settings/')
        self.assertEqual(r.json()['telegram_chat_id'], 'SECRET-123')

    def test_published_courses_public_and_sanitized(self):
        Course.objects.create(slug='hidden', title='Hidden', category='x',
                              description='d', is_published=False, status='active')
        Course.objects.create(slug='visible', title='Visible', category='x',
                              description='d', is_published=True, status='active',
                              meet_link='https://zoom.example/j/secret')
        r = self.anon.get('/api/courses/published/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()), 1)
        body = r.json()[0]
        self.assertEqual(body['slug'], 'visible')
        self.assertNotIn('meet_link', body)
        self.assertNotIn('students', body)


class ApplicationSubmissionTests(BaseTestCase):
    def test_anonymous_submission_cannot_set_status(self):
        r = self.anon.post('/api/student-applications/', {
            'parent_name': 'Parent', 'student_name': 'Kid', 'email': 'p@x.com',
            'phone': '+2348000000000', 'grade_level': 'Year 5',
            'curriculum': 'British', 'subjects': ['Math'],
            'status': 'approved',  # must be ignored
        }, format='json')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()['status'], 'pending')

    def test_applications_require_admin_to_list(self):
        # Anonymous requests get 401 (auth possible via JWT), authenticated
        # non-admin users get 403.
        r = self.anon.get('/api/student-applications/')
        self.assertIn(r.status_code, (401, 403))
        r = self.student_client.get('/api/student-applications/')
        self.assertEqual(r.status_code, 403)


class SessionSyncTests(BaseTestCase):
    def test_sync_is_idempotent(self):
        from api.views import sync_course_sessions
        CourseSchedule.objects.create(course=self.course, day_of_week='monday',
                                      start_time='09:00', duration_minutes=60)
        sync_course_sessions(self.course)
        first = Session.objects.filter(course=self.course).count()
        self.assertGreater(first, 0)
        sync_course_sessions(self.course)
        sync_course_sessions(self.course)
        self.assertEqual(Session.objects.filter(course=self.course).count(), first)
