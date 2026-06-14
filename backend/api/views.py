from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
import threading
from .serializers import (
    UserSerializer, ProfileSerializer, CourseSerializer, 
    StudentTutorAssignmentSerializer, SessionSerializer, InviteCodeSerializer, 
    TutorApplicationSerializer, StudentApplicationSerializer, ContactMessageSerializer,
    GlobalSettingSerializer, CourseScheduleSerializer
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
from .throttles import PasswordResetThrottle
from django.db.models.signals import m2m_changed, post_save
from django.dispatch import receiver
import datetime

def sync_course_sessions(course):
    """
    Generate recurring sessions (weekly timetable) for the course based on CourseSchedule.
    All sessions are course-wide (no per-student copies).
    """
    schedules = course.schedules.all()
    tutor = course.tutor

    if not schedules:
        return

    now = timezone.now()
    today = now.date()

    # Generate sessions for the next 28 days
    for day_offset in range(28):
        future_date = today + datetime.timedelta(days=day_offset)
        weekday_name = future_date.strftime('%A').lower()

        day_schedules = schedules.filter(day_of_week=weekday_name)
        for schedule in day_schedules:
            naive_start = datetime.datetime.combine(future_date, schedule.start_time)
            start_time = timezone.make_aware(naive_start, timezone.get_current_timezone())

            if start_time < now:
                continue

            # Create session if not exists for EACH student in the course
            students = course.students.all()
            if not students.exists():
                continue

            for student in students:
                exists = Session.objects.filter(
                    course=course,
                    student=student,
                    start_time=start_time
                ).exists()

                if not exists:
                    Session.objects.create(
                        course=course,
                        student=student,
                        tutor=tutor,
                        start_time=start_time,
                        duration_minutes=schedule.duration_minutes,
                        meet_link=course.meet_link,
                        status=SessionStatus.SCHEDULED
                    )

    # Update tutor reference on future sessions if tutor changed
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

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def list(self, request, *args, **kwargs):
        # Always return the first setting object (singleton behavior)
        instance = GlobalSetting.objects.first()
        if not instance:
            # Create a default if none exists
            instance = GlobalSetting.objects.create()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def update_settings(self, request):
        instance = GlobalSetting.objects.first()
        if not instance:
            instance = GlobalSetting.objects.create()
        
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
            
            # Get the latest chat ID
            latest_chat_id = str(results[-1]["message"]["chat"]["id"])
            
            instance = GlobalSetting.objects.first()
            if not instance:
                instance = GlobalSetting.objects.create()
            
            instance.telegram_chat_id = latest_chat_id
            instance.save()
            
            # Send a confirmation message
            from .telegram_utils import send_telegram_notification
            send_telegram_notification(f"✅ <b>Success!</b> Your Telegram Chat ID ({latest_chat_id}) has been linked to the Impact Tutors Platform.")
            
            return Response({
                "message": "Telegram Chat ID synced successfully!",
                "telegram_chat_id": latest_chat_id
            })
        except Exception as e:
            return Response({"error": f"Failed to sync with Telegram: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StudentApplicationViewSet(viewsets.ModelViewSet):
    queryset = StudentApplication.objects.all().order_by('-created_at')
    serializer_class = StudentApplicationSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def perform_create(self, serializer):
        application = serializer.save()
        
        # Send email in a background thread to prevent Gunicorn timeouts
        def send_async_email():
            try:
                send_mail(
                    subject=f"New Student Application: {application.student_name}",
                    message=f"A new student application has been submitted by {application.student_name} ({application.grade_level}).\n\nContact: {application.contact_detail} ({application.preferred_contact_method})\n\nPlease check the admin dashboard for details.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.EMAIL_HOST_USER],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Error sending student application email: {e}")

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

    def perform_create(self, serializer):
        application = serializer.save()
        
        # Send email in a background thread to prevent Gunicorn timeouts
        def send_async_email():
            try:
                send_mail(
                    subject=f"New Tutor Application: {application.full_name}",
                    message=f"A new tutor application has been submitted by {application.full_name} ({application.email}).\n\nContact: {application.contact_detail} ({application.preferred_contact_method})\n\nPlease check the admin dashboard for details.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.EMAIL_HOST_USER],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Error sending tutor application email: {e}")

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
    
    @action(detail=True, methods=['post'])
    def toggle_onboarding(self, request, pk=None):
        profile = self.get_object()
        is_onboarded = request.data.get('is_onboarded', True)
        profile.is_onboarded = is_onboarded
        profile.save()
        return Response({'status': f'onboarding set to {is_onboarded}'})
    
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
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            deleted_count, _ = Course.objects.filter(id__in=ids).delete()
            return Response({"message": f"Successfully deleted {deleted_count} courses"}, status=status.HTTP_204_NO_CONTENT)

class SessionViewSet(viewsets.ModelViewSet):
    # include related student, tutor and course by default to avoid N+1
    queryset = Session.objects.select_related('student', 'tutor', 'course').all()
    serializer_class = SessionSerializer
    
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
            return Session.objects.all()
        
        try:
            profile = user.profile
            if profile.role == 'student':
                # Students see their specific sessions
                return Session.objects.filter(
                    student=profile
                ).select_related('course', 'tutor')
            elif profile.role == 'tutor':
                # Tutors see sessions for all their assigned students
                return Session.objects.filter(
                    course__tutor=profile
                ).select_related('course', 'student')
        except Profile.DoesNotExist:
            return Session.objects.none()
        
        return Session.objects.none()

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            deleted_count, _ = Session.objects.filter(id__in=ids).delete()
            return Response({"message": f"Successfully deleted {deleted_count} sessions"}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='student-mark-attendance')
    def student_mark_attendance(self, request, pk=None):
        session = self.get_object()
        if not request.user.is_staff and session.student.user != request.user:
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
        if not request.user.is_staff and session.tutor.user != request.user:
            return Response({"error": "You are not authorized to mark attendance for this session."}, status=status.HTTP_403_FORBIDDEN)
        
        session.tutor_marked_held = True
        session.tutor_confirmed_student = request.data.get('confirmed_student', True) == True or request.data.get('confirmed_student') == 'true'
        session.tutor_marked_at = timezone.now()
        session.status = 'completed'
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
    serializer_class = UserSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        role = request.data.get('role')
        full_name = request.data.get('full_name')
        email = request.data.get('email')
        password = request.data.get('password')
        invite_code = request.data.get('invite_code')

        if not email or not password or not full_name or not role:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure email is unique
        if User.objects.filter(email__iexact=email).exists():
            return Response({"error": "A user with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce Invite Code for both Students and Tutors
        if not invite_code:
            return Response({"error": f"Registration code required for {role}s"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # fetch related application links in the same query to avoid extra lookups
            invite = InviteCode.objects.select_related('student_application', 'tutor_application').get(code=invite_code.upper(), role=role, is_used=False)
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
        final_grade = (student_app.grade_level if student_app else None) or request.data.get('grade_level')
        final_curriculum = (student_app.curriculum if student_app else None) or request.data.get('curriculum')

        user = User.objects.create_user(
            username=email.lower(),
            email=email.lower(),
            password=password
        )

        Profile.objects.create(
            user=user,
            role=role,
            full_name=final_full_name,
            phone=request.data.get('phone') or (student_app.phone if student_app else (tutor_app.phone if tutor_app else None)),
            age=request.data.get('age'),
            grade_level=final_grade,
            curriculum=final_curriculum,
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

    def perform_create(self, serializer):
        message = serializer.save()
        
        # Send email in a background thread to prevent Gunicorn timeouts
        def send_async_email():
            try:
                send_mail(
                    subject=f"New Inquiry: {message.subject}",
                    message=f"You received a new message from {message.name} ({message.email}):\n\n{message.message}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.EMAIL_HOST_USER],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Error sending inquiry email: {e}")

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
        
        # Add basic length check if needed, or rely on Django validators
        if len(new_password) < 8:
            return Response({"new_password": ["Password must be at least 8 characters long."]}, status=status.HTTP_400_BAD_REQUEST)

        self.object.set_password(new_password)
        self.object.save()
        return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)

class CourseScheduleViewSet(viewsets.ModelViewSet):
    # select_related course to avoid N+1 when serializing schedule.course.title
    queryset = CourseSchedule.objects.select_related('course').all()
    serializer_class = CourseScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

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

    def perform_create(self, serializer):
        schedule = serializer.save()
        sync_course_sessions(schedule.course)

    def perform_update(self, serializer):
        schedule = serializer.save()
        sync_course_sessions(schedule.course)

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
            
        import random
        import string
        otp = ''.join(random.choices(string.digits, k=6))
        
        PasswordResetOTP.objects.filter(email__iexact=email, is_used=False).update(is_used=True)
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
        
        send_sendpulse_email(
            subject, 
            html_content, 
            text_content, 
            user.email, 
            to_name=user.profile.full_name if hasattr(user, 'profile') else "User"
        )
        
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
            
        try:
            reset_record = PasswordResetOTP.objects.filter(
                email__iexact=email,
                otp=otp,
                is_used=False
            ).latest('created_at')
        except PasswordResetOTP.DoesNotExist:
            return Response({"error": "Invalid or expired OTP code"}, status=status.HTTP_400_BAD_REQUEST)
            
        if reset_record.is_expired():
            reset_record.is_used = True
            reset_record.save()
            return Response({"error": "OTP code has expired"}, status=status.HTTP_400_BAD_REQUEST)
            
        if len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters long"}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.get(email__iexact=email)
        user.set_password(new_password)
        user.save()
        
        reset_record.is_used = True
        reset_record.save()
        
        return Response({"message": "Password reset successfully!"}, status=status.HTTP_200_OK)

