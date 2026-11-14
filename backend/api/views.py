from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db import transaction, IntegrityError
from django.core.mail import send_mail
from django.conf import settings
import threading
import secrets
import string
from .serializers import (
    UserSerializer, RegisterSerializer, ProfileSerializer, CourseSerializer,
    StudentTutorAssignmentSerializer, SessionSerializer, InviteCodeSerializer,
    TutorApplicationSerializer, StudentApplicationSerializer, ContactMessageSerializer,
    GlobalSettingSerializer, PublicGlobalSettingSerializer, CourseScheduleSerializer
)
from .telegram_utils import send_telegram_notification
from .models import (
    Profile, Course, StudentTutorAssignment, Session, SessionStatus,
    InviteCode, StudentApplication, TutorApplication, ContactMessage,
    GlobalSetting, CourseSchedule, PasswordResetOTP
)
from .sendpulse import send_sendpulse_email
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .throttles import PasswordResetThrottle, RegisterThrottle, AnonSubmitThrottle
from django.db.models.signals import m2m_changed, post_save
from django.dispatch import receiver
from rest_framework.pagination import PageNumberPagination
import datetime
import logging

logger = logging.getLogger(__name__)


class LargeResultsSetPagination(PageNumberPagination):
    """
    Sessions are the only endpoint that grows without bound (28 days of
    generated sessions × students, regenerated on every schedule save).
    500/page bounds the payload while keeping the admin UI un-truncated
    at realistic business scale; clients can request ?page=N if needed.
    """
    page_size = 500
    page_size_query_param = 'page_size'
    max_page_size = 1000


def get_global_settings():
    """
    Race-safe singleton accessor for the GlobalSetting row. Concurrent
    callers converge on the same row via get_or_create.
    """
    obj = GlobalSetting.objects.first()
    if obj is None:
        obj, _ = GlobalSetting.objects.get_or_create(id=1)
    return obj


def revoke_user_refresh_tokens(user):
    """
    Blacklist every outstanding refresh token for a user. Used after password
    changes/resets so stolen refresh tokens cannot mint new access tokens.
    (Pre-existing access tokens expire within ACCESS_TOKEN_LIFETIME.)
    """
    from rest_framework_simplejwt.tokens import RefreshToken
    from rest_framework_simplejwt.exceptions import TokenError
    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
    for token in OutstandingToken.objects.filter(user=user):
        try:
            RefreshToken(token.token).blacklist()
        except TokenError:
            # Already blacklisted or structurally invalid — nothing to do.
            pass

def sync_course_sessions(course):
    """
    Generate recurring sessions (weekly timetable) for the course based on
    CourseSchedule, covering the next 28 days.

    Attendance is tracked per student, so one Session row exists per
    (course, student, start_time). The UniqueConstraint on Session makes
    re-runs idempotent: candidates are bulk-created with
    ignore_conflicts, so duplicate schedules/students cannot create
    duplicate sessions and concurrent syncs are safe.

    Called from the CourseSchedule post_save signal and the
    Course.students m2m post_add signal — no other call sites needed.
    """
    schedules = list(course.schedules.all())
    if not schedules:
        return

    students = list(course.students.all())
    if not students:
        return

    tutor = course.tutor
    now = timezone.now()
    today = now.date()

    # Group schedules by weekday once; then collect every upcoming
    # (student, start_time) candidate in a single pass — no per-slot
    # exists() queries.
    schedules_by_day = {}
    for schedule in schedules:
        schedules_by_day.setdefault(schedule.day_of_week, []).append(schedule)

    candidates = []
    for day_offset in range(28):
        future_date = today + datetime.timedelta(days=day_offset)
        for schedule in schedules_by_day.get(future_date.strftime('%A').lower(), []):
            naive_start = datetime.datetime.combine(future_date, schedule.start_time)
            start_time = timezone.make_aware(naive_start, timezone.get_current_timezone())
            if start_time < now:
                continue
            for student in students:
                candidates.append((student, start_time, schedule.duration_minutes))

    if candidates:
        Session.objects.bulk_create(
            [
                Session(
                    course=course,
                    student=student,
                    tutor=tutor,
                    start_time=start_time,
                    duration_minutes=duration_minutes,
                    meet_link=course.meet_link,
                    status=SessionStatus.SCHEDULED,
                )
                for student, start_time, duration_minutes in candidates
            ],
            ignore_conflicts=True,  # dedupes against the UniqueConstraint
        )

    # Update tutor reference on future sessions if the course tutor changed
    Session.objects.filter(
        course=course,
        status=SessionStatus.SCHEDULED,
        start_time__gte=now
    ).update(tutor=tutor)

@receiver(m2m_changed, sender=Course.students.through)
def course_students_changed(sender, instance, action, reverse, model, pk_set, **kwargs):
    # When students are added/removed from a course, ensure course sessions exist.
    # Sessions are course-wide (no per-student copies).
    if action == 'post_add' and pk_set:
        sync_course_sessions(instance)
    elif action == 'post_remove' and pk_set:
        # No action needed; sessions remain course-wide
        pass

@receiver(post_save, sender=CourseSchedule)
def course_schedule_saved(sender, instance, created, **kwargs):
    sync_course_sessions(instance.course)


class GlobalSettingViewSet(viewsets.ModelViewSet):
    queryset = GlobalSetting.objects.all()
    serializer_class = GlobalSettingSerializer
    # The singleton row is auto-created by get_global_settings();
    # disallow manual creation and deletion via the API.
    http_method_names = ['get', 'patch', 'put', 'head', 'options']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_serializer_class(self):
        # The public list/retrieve response must never leak the Telegram
        # chat ID (or any internal config); staff still get the full object
        # for the admin settings panel.
        if self.action in ['list', 'retrieve'] and not self.request.user.is_staff:
            return PublicGlobalSettingSerializer
        return GlobalSettingSerializer

    def list(self, request, *args, **kwargs):
        # Singleton row, created on first access (race-safe)
        instance = get_global_settings()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def update_settings(self, request):
        instance = get_global_settings()

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def sync_telegram(self, request):
        import requests
        bot_token = getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
        if not bot_token:
            return Response({"error": "TELEGRAM_BOT_TOKEN not configured in backend .env"}, status=status.HTTP_400_BAD_REQUEST)

        url = f"https://api.telegram.org/bot{bot_token}/getUpdates"
        try:
            response = requests.get(url, timeout=10)
            data = response.json()
            if not data.get("ok"):
                return Response({"error": f"Telegram API error: {data.get('description')}"}, status=status.HTTP_400_BAD_REQUEST)

            results = data.get("result", [])
            if not results:
                return Response({"error": "No recent messages found. Please message your bot first, then try again."}, status=status.HTTP_400_BAD_REQUEST)

            # Find the newest update that actually carries a chat id — the
            # latest update may be an edited_message/channel_post (previously
            # this raised KeyError -> 500).
            latest_chat_id = None
            for update in reversed(results):
                message = (
                    update.get("message")
                    or update.get("edited_message")
                    or update.get("channel_post")
                )
                chat_id = (message or {}).get("chat", {}).get("id")
                if chat_id is not None:
                    latest_chat_id = str(chat_id)
                    break

            if latest_chat_id is None:
                return Response({"error": "No chat found in recent updates. Send a plain message to your bot and retry."}, status=status.HTTP_400_BAD_REQUEST)

            instance = get_global_settings()
            instance.telegram_chat_id = latest_chat_id
            instance.save(update_fields=['telegram_chat_id', 'updated_at'])

            # Send a confirmation message
            send_telegram_notification(f"✅ <b>Success!</b> Your Telegram Chat ID ({latest_chat_id}) has been linked to the Impact Tutors Platform.")

            return Response({
                "message": "Telegram Chat ID synced successfully!",
                "telegram_chat_id": latest_chat_id
            })
        except requests.RequestException as e:
            logger.error("Telegram sync failed: %s", e)
            return Response({"error": "Could not reach Telegram. Please try again in a moment."}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception:
            logger.exception("Unexpected error during Telegram sync")
            return Response({"error": "Failed to sync with Telegram."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StudentApplicationViewSet(viewsets.ModelViewSet):
    queryset = StudentApplication.objects.all().order_by('-created_at')
    serializer_class = StudentApplicationSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_throttles(self):
        # Public form spam guard — applies to anonymous submissions only.
        if self.action == 'create':
            return [AnonSubmitThrottle()]
        return []

    def perform_create(self, serializer):
        application = serializer.save()
        
        # Send email in a background thread to prevent Gunicorn timeouts
        def send_async_email():
            try:
                recipient = getattr(settings, 'NOTIFICATION_EMAIL', None)
                if not recipient:
                    logger.warning('NOTIFICATION_EMAIL is not configured; skipping application email.')
                    return
                send_mail(
                    subject=f"New Student Application: {application.student_name}",
                    message=f"A new student application has been submitted by {application.student_name} ({application.grade_level}).\n\nContact: {application.contact_detail} ({application.preferred_contact_method})\n\nPlease check the admin dashboard for details.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient],
                    fail_silently=True,
                )
            except Exception:
                logger.exception('Error sending student application email')

        threading.Thread(target=send_async_email).start()

        # Send Telegram notification
        telegram_msg = (
            f"<b>🎓 New Student Application</b>\n\n"
            f"<b>Name:</b> {application.student_name}\n"
            f"<b>Grade:</b> {application.grade_level}\n"
            f"<b>Curriculum:</b> {application.curriculum}\n"
            f"<b>Contact:</b> {application.contact_detail} ({application.preferred_contact_method})"
        )
        send_telegram_notification(telegram_msg)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        application = self.get_object()
        application.status = 'approved'
        application.save()
        return Response({'status': 'application approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        application = self.get_object()
        application.status = 'rejected'
        application.save()
        return Response({'status': 'application rejected'})

class TutorApplicationViewSet(viewsets.ModelViewSet):
    queryset = TutorApplication.objects.all().order_by('-created_at')
    serializer_class = TutorApplicationSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_throttles(self):
        # Public form spam guard — applies to anonymous submissions only.
        if self.action == 'create':
            return [AnonSubmitThrottle()]
        return []

    def perform_create(self, serializer):
        application = serializer.save()
        
        # Send email in a background thread to prevent Gunicorn timeouts
        def send_async_email():
            try:
                recipient = getattr(settings, 'NOTIFICATION_EMAIL', None)
                if not recipient:
                    logger.warning('NOTIFICATION_EMAIL is not configured; skipping application email.')
                    return
                send_mail(
                    subject=f"New Tutor Application: {application.full_name}",
                    message=f"A new tutor application has been submitted by {application.full_name} ({application.email}).\n\nContact: {application.contact_detail} ({application.preferred_contact_method})\n\nPlease check the admin dashboard for details.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient],
                    fail_silently=True,
                )
            except Exception:
                logger.exception('Error sending tutor application email')

        threading.Thread(target=send_async_email).start()

        # Send Telegram notification
        telegram_msg = (
            f"<b>👨‍🏫 New Tutor Application</b>\n\n"
            f"<b>Name:</b> {application.full_name}\n"
            f"<b>Email:</b> {application.email}\n"
            f"<b>Subjects:</b> {application.subjects}\n"
            f"<b>Contact:</b> {application.contact_detail} ({application.preferred_contact_method})"
        )
        send_telegram_notification(telegram_msg)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        application = self.get_object()
        application.status = 'approved'
        application.save()
        return Response({'status': 'application approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        application = self.get_object()
        application.status = 'rejected'
        application.save()
        return Response({'status': 'application rejected'})

class InviteCodeViewSet(viewsets.ModelViewSet):
    # select_related for FK links to applications to avoid N+1 when serializing
    queryset = InviteCode.objects.select_related('student_application', 'tutor_application').order_by('-created_at')
    serializer_class = InviteCodeSerializer
    permission_classes = [permissions.IsAdminUser]

class ProfileViewSet(viewsets.ModelViewSet):
    # profile often needs the related user; select_related avoids extra queries
    queryset = Profile.objects.select_related('user').all()
    serializer_class = ProfileSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = request.user.profile
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def toggle_onboarding(self, request, pk=None):
        # Admin-only: users must not be able to self-activate past the
        # onboarding/waitlist gate (this would defeat admin vetting).
        profile = self.get_object()
        is_onboarded = request.data.get('is_onboarded', True)
        profile.is_onboarded = is_onboarded
        profile.save()
        return Response({'status': f'onboarding set to {is_onboarded}'})

    def perform_destroy(self, instance):
        # Deleting a Profile without its User bricks /profiles/me/
        # (Profile.DoesNotExist -> 500), so profile deletion is treated as
        # full account deletion. Non-staff users can only reach their own
        # profile via get_queryset(); for admins this removes the account.
        instance.user.delete()

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Profile.objects.none()
        if user.is_staff:
            return Profile.objects.select_related('user').all()
        return Profile.objects.select_related('user').filter(user=user)

class CourseViewSet(viewsets.ModelViewSet):
    # Include related tutor, students and schedules by default to prevent N+1 in serializers
    queryset = Course.objects.select_related('tutor').prefetch_related('students', 'schedules').all()
    serializer_class = CourseSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Course.objects.none()
        # Always include tutor (FK) and students/schedules to avoid N+1 when serializing
        base_qs = Course.objects.select_related('tutor').prefetch_related('students', 'schedules')
        if user.is_staff:
            return base_qs.all()
        
        try:
            profile = user.profile
            if profile.role == 'student':
                return base_qs.filter(students=profile)
            elif profile.role == 'tutor':
                return base_qs.filter(tutor=profile)
        except Profile.DoesNotExist:
            return Course.objects.none()
        
        return Course.objects.none()

    def get_permissions(self):
        if self.action == 'published':
            # Public, read-only listing for the marketing site.
            return [permissions.AllowAny()]
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=['get'])
    def published(self, request):
        """
        Public, read-only listing of published+active courses for the
        marketing site. Excludes meet links and student data.
        """
        from .serializers import PublicCourseSerializer
        qs = (
            Course.objects
            .filter(is_published=True, status='active')
            .select_related('tutor')
            .order_by('-updated_at')
        )
        serializer = PublicCourseSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Filter through get_queryset() so the request's own scope applies —
        # never delete straight from the manager.
        with transaction.atomic():
            deleted_count, _ = self.get_queryset().filter(id__in=ids).delete()
            return Response({"message": f"Successfully deleted {deleted_count} courses"}, status=status.HTTP_204_NO_CONTENT)

class SessionViewSet(viewsets.ModelViewSet):
    # include related student, tutor and course by default to avoid N+1
    queryset = Session.objects.select_related('student', 'tutor', 'course').all()
    serializer_class = SessionSerializer
    pagination_class = LargeResultsSetPagination

    def get_permissions(self):
        # Writing sessions (create/update/delete/bulk-delete) is admin-only —
        # previously ANY authenticated user (e.g. a student) could create
        # sessions on any course with an arbitrary meet_link, or bulk-delete
        # other users' sessions. Attendance marking keeps per-role ownership
        # checks inside the actions themselves.
        if self.action in ('student_mark_attendance', 'tutor_mark_attendance'):
            return [permissions.IsAuthenticated()]
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.validated_data.get('course')
        start_time = serializer.validated_data.get('start_time')
        tutor = serializer.validated_data.get('tutor') or course.tutor
        duration_minutes = serializer.validated_data.get('duration_minutes', 60)
        meet_link = serializer.validated_data.get('meet_link') or course.meet_link
        
        created_by = None
        if self.request.user.is_authenticated:
            try:
                created_by = self.request.user.profile
            except (AttributeError, Profile.DoesNotExist):
                pass
                
        students = course.students.all()
        sessions_created = []
        
        if not students.exists():
            return Response({"error": "Cannot create session for a course with no students."}, status=status.HTTP_400_BAD_REQUEST)
            
        with transaction.atomic():
            for student in students:
                session = Session.objects.create(
                    course=course,
                    student=student,
                    tutor=tutor,
                    start_time=start_time,
                    duration_minutes=duration_minutes,
                    meet_link=meet_link,
                    created_by=created_by,
                    status=SessionStatus.SCHEDULED
                )
                sessions_created.append(session)
                
        # Return the first session as representative for the response
        resp_serializer = self.get_serializer(sessions_created[0])
        headers = self.get_success_headers(resp_serializer.data)
        return Response(resp_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Session.objects.none()
        if user.is_staff:
            qs = Session.objects.all()
        else:
            try:
                profile = user.profile
                if profile.role == 'student':
                    # Students see their specific sessions
                    qs = Session.objects.filter(student=profile)
                elif profile.role == 'tutor':
                    # Tutors see sessions for all their courses
                    qs = Session.objects.filter(course__tutor=profile)
                else:
                    return Session.objects.none()
            except Profile.DoesNotExist:
                return Session.objects.none()

        # Honour the ?status= filter the dashboards send — previously it
        # was silently ignored, so "Upcoming Sessions" listed completed
        # and no-show sessions too.
        requested_status = self.request.query_params.get('status')
        if requested_status:
            qs = qs.filter(status=requested_status)
        return qs.select_related('course', 'student', 'tutor')

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Filter through get_queryset() so the request's own scope applies —
        # never delete straight from the manager (this previously let any
        # authenticated user delete ANY session in the database by ID).
        with transaction.atomic():
            deleted_count, _ = self.get_queryset().filter(id__in=ids).delete()
            return Response({"message": f"Successfully deleted {deleted_count} sessions"}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='student-mark-attendance')
    def student_mark_attendance(self, request, pk=None):
        session = self.get_object()
        # session.student is nullable — guard before dereferencing (previously
        # a course-wide session crashed this endpoint with a 500).
        if not request.user.is_staff and (session.student is None or session.student.user != request.user):
            return Response({"error": "You are not authorized to mark attendance for this session."}, status=status.HTTP_403_FORBIDDEN)
        # Only allow students to mark attendance after the session has started
        now = timezone.now()
        window_hours = getattr(settings, 'ATTENDANCE_MARK_WINDOW_HOURS', 6)

        if not session.start_time:
            return Response({"error": "Session start time is not set."}, status=status.HTTP_400_BAD_REQUEST)

        # Allow marking from start_time up to start_time + window_hours
        allowed_start = session.start_time
        allowed_end = session.start_time + datetime.timedelta(hours=window_hours)

        if not (allowed_start <= now <= allowed_end):
            return Response({"error": f"Attendance can only be marked between {allowed_start} and {allowed_end}."}, status=status.HTTP_400_BAD_REQUEST)

        session.student_marked_present = True
        session.student_feedback = request.data.get('feedback', '')
        session.student_marked_at = now
        if session.tutor_marked_held:
            session.status = SessionStatus.COMPLETED
        session.save()
        return Response({"message": "Attendance marked successfully.", "status": session.status})

    @action(detail=True, methods=['post'], url_path='tutor-mark-attendance')
    def tutor_mark_attendance(self, request, pk=None):
        session = self.get_object()
        # session.tutor is nullable — guard before dereferencing.
        if not request.user.is_staff and (session.tutor is None or session.tutor.user != request.user):
            return Response({"error": "You are not authorized to mark attendance for this session."}, status=status.HTTP_403_FORBIDDEN)

        # Robust boolean parse (JSON bool, string or absent → default true).
        confirmed_raw = request.data.get('confirmed_student', True)
        confirmed = confirmed_raw if isinstance(confirmed_raw, bool) else str(confirmed_raw).lower() in ('true', '1', 'yes')

        session.tutor_marked_held = True
        session.tutor_confirmed_student = confirmed
        session.tutor_marked_at = timezone.now()
        # The student was verified present → completed; absent → no_show
        # (previously every tutor marking forced 'completed', and the
        # NO_SHOW status was never used anywhere).
        session.status = SessionStatus.COMPLETED if confirmed else SessionStatus.NO_SHOW
        session.save()
        return Response({"message": "Attendance marked successfully.", "status": session.status})


class StudentTutorAssignmentViewSet(viewsets.ModelViewSet):
    # student and tutor are FKs; select_related avoids extra queries when serializing
    queryset = StudentTutorAssignment.objects.select_related('student', 'tutor').all()
    serializer_class = StudentTutorAssignmentSerializer
    permission_classes = [permissions.IsAdminUser]

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    throttle_classes = [RegisterThrottle]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        # All input (email format, password strength, role choices, lengths)
        # is validated by RegisterSerializer — never trust raw request.data.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        role = data['role']
        email = data['email'].lower()
        full_name = data['full_name']
        password = data['password']
        invite_code = data['invite_code']

        # Ensure email is unique
        if User.objects.filter(email__iexact=email).exists():
            return Response({"error": "A user with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce Invite Code for both Students and Tutors.
        # select_for_update locks the code row so two concurrent
        # registrations cannot both redeem the same single-use code.
        if not invite_code:
            return Response({"error": f"Registration code required for {role}s"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            invite = (
                InviteCode.objects
                .select_for_update()
                .select_related('student_application', 'tutor_application')
                .get(code=invite_code.upper(), role=role, is_used=False)
            )
            # Optional: Lock code to email if provided in InviteCode
            if invite.target_email and invite.target_email.lower() != email.lower():
                return Response({"error": "This code is assigned to a different email address"}, status=status.HTTP_400_BAD_REQUEST)

            invite.is_used = True
            invite.save()
        except InviteCode.DoesNotExist:
            return Response({"error": "Invalid or already used registration code"}, status=status.HTTP_400_BAD_REQUEST)

        # Link application data if available
        student_app = invite.student_application
        tutor_app = invite.tutor_application

        # Prioritize application data, but allow request data override
        final_full_name = (student_app.student_name if student_app else (tutor_app.full_name if tutor_app else None)) or full_name
        final_grade = (student_app.grade_level if student_app else None) or data.get('grade_level')
        final_curriculum = (student_app.curriculum if student_app else None) or data.get('curriculum')

        try:
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password
            )
        except IntegrityError:
            # Username collision with a pre-existing account (e.g. created
            # via Django admin with a non-email username).
            return Response({"error": "A user with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        Profile.objects.create(
            user=user,
            role=role,
            full_name=final_full_name,
            phone=data.get('phone') or (student_app.phone if student_app else (tutor_app.phone if tutor_app else None)),
            age=data.get('age'),
            grade_level=final_grade,
            curriculum=final_curriculum,
            school_level=data.get('school_level'),
            country=data.get('country') or 'Nigeria',
            tutor_bio=data.get('tutor_bio'),
            is_onboarded=True # codes are vetting mechanisms
        )

        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)

class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_throttles(self):
        # Public form spam guard — applies to anonymous submissions only.
        if self.action == 'create':
            return [AnonSubmitThrottle()]
        return []

    def perform_create(self, serializer):
        message = serializer.save()
        
        # Send email in a background thread to prevent Gunicorn timeouts
        def send_async_email():
            try:
                recipient = getattr(settings, 'NOTIFICATION_EMAIL', None)
                if not recipient:
                    logger.warning('NOTIFICATION_EMAIL is not configured; skipping inquiry email.')
                    return
                send_mail(
                    subject=f"New Inquiry: {message.subject}",
                    message=f"You received a new message from {message.name} ({message.email}):\n\n{message.message}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient],
                    fail_silently=True,
                )
            except Exception:
                logger.exception('Error sending inquiry email')

        threading.Thread(target=send_async_email).start()

        # Send Telegram notification
        telegram_msg = (
            f"<b>✉️ New Inquiry</b>\n\n"
            f"<b>Name:</b> {message.name}\n"
            f"<b>Subject:</b> {message.subject}\n"
            f"<b>Message:</b> {message.message[:200]}..."
        )
        send_telegram_notification(telegram_msg)

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    model = User
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not self.object.check_password(old_password):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({"new_password": ["Passwords do not match."]}, status=status.HTTP_400_BAD_REQUEST)

        # Full Django password validators (length, common passwords,
        # user-attribute similarity, numeric-only…).
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_password(new_password, user=self.object)
        except DjangoValidationError as e:
            return Response({"new_password": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        self.object.set_password(new_password)
        self.object.save()

        # Revoke all refresh tokens so a stolen session cannot survive the
        # password change; outstanding access tokens die within the hour.
        revoke_user_refresh_tokens(self.object)

        return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)

class CourseScheduleViewSet(viewsets.ModelViewSet):
    # select_related course to avoid N+1 when serializing schedule.course.title
    queryset = CourseSchedule.objects.select_related('course').all()
    serializer_class = CourseScheduleSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return CourseSchedule.objects.none()
        if user.is_staff:
            return CourseSchedule.objects.select_related('course').all()
        # Return schedules for courses related to student or tutor
        try:
            profile = user.profile
            if profile.role == 'student':
                return CourseSchedule.objects.select_related('course').filter(course__students=profile)
            elif profile.role == 'tutor':
                return CourseSchedule.objects.select_related('course').filter(course__tutor=profile)
        except Profile.DoesNotExist:
            return CourseSchedule.objects.none()
        return CourseSchedule.objects.none()
    # Session generation happens via the CourseSchedule post_save signal —
    # perform_create/update previously double-synced on every save.

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetThrottle]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"message": "If this email is registered, you will receive an OTP code shortly."}, status=status.HTTP_200_OK)

        # Cryptographically secure 6-digit code (never `random`).
        otp = ''.join(secrets.choice(string.digits) for _ in range(6))

        # Invalidate previous codes for this address and clean out stale
        # records so the table cannot grow without bound.
        PasswordResetOTP.objects.filter(email__iexact=email, is_used=False).update(is_used=True)
        PasswordResetOTP.objects.filter(
            created_at__lt=timezone.now() - datetime.timedelta(days=1)
        ).delete()
        PasswordResetOTP.objects.create(email=user.email, otp=otp)

        subject = "Your Password Reset OTP - Impact Tutors"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #eee;">
            <h2 style="color: #4F46E5; text-align: center;">Impact Tutors</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password. Use the verification code below to proceed:</p>
            <div style="background-color: #EEF2F6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1E293B;">{otp}</span>
            </div>
            <p style="color: #64748B; font-size: 14px;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
        """
        text_content = f"Your Password Reset OTP is: {otp}. This code is valid for 10 minutes."

        # Send in a background thread: keeps response timing uniform for
        # registered/unregistered addresses (removes an enumeration side
        # channel) and avoids slow email APIs holding the request.
        to_name = user.profile.full_name if hasattr(user, 'profile') else "User"
        threading.Thread(
            target=send_sendpulse_email,
            args=(subject, html_content, text_content, user.email),
            kwargs={'to_name': to_name},
            daemon=True,
        ).start()

        return Response({"message": "If this email is registered, you will receive an OTP code shortly."}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetThrottle]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not email or not otp or not new_password:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch the latest unused OTP for this address WITHOUT matching the
        # code itself, so failed attempts can be counted and the OTP burned
        # after MAX_ATTEMPTS (brute-force protection on the 6-digit space).
        reset_record = (
            PasswordResetOTP.objects
            .filter(email__iexact=email, is_used=False)
            .order_by('-created_at')
            .first()
        )
        if not reset_record or reset_record.is_expired():
            if reset_record:
                reset_record.is_used = True
                reset_record.save(update_fields=['is_used'])
            return Response({"error": "Invalid or expired OTP code"}, status=status.HTTP_400_BAD_REQUEST)

        if reset_record.otp != otp:
            reset_record.register_failed_attempt()
            return Response({"error": "Invalid or expired OTP code"}, status=status.HTTP_400_BAD_REQUEST)

        # Full Django password validators (length, common passwords…).
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            user = User.objects.get(email__iexact=email)
            validate_password(new_password, user=user)
        except User.DoesNotExist:
            return Response({"error": "Invalid or expired OTP code"}, status=status.HTTP_400_BAD_REQUEST)
        except DjangoValidationError as e:
            return Response({"error": '; '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        reset_record.is_used = True
        reset_record.save(update_fields=['is_used'])

        # Revoke all refresh tokens — a stolen session cannot survive the reset.
        revoke_user_refresh_tokens(user)

        return Response({"message": "Password reset successfully!"}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Blacklists the provided refresh token so it cannot be reused.
    The frontend should call this before clearing cookies.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.exceptions import TokenError
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            # Already blacklisted or invalid — still clear the session.
            pass

        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)
