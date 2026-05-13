from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db import transaction
from .serializers import (
    UserSerializer, ProfileSerializer, CourseSerializer, 
    StudentTutorAssignmentSerializer, SessionSerializer, InviteCodeSerializer, 
    TutorApplicationSerializer, StudentApplicationSerializer, ContactMessageSerializer
)
from .models import (
    Profile, Course, StudentTutorAssignment, Session, 
    InviteCode, StudentApplication, TutorApplication, ContactMessage
)

class StudentApplicationViewSet(viewsets.ModelViewSet):
    queryset = StudentApplication.objects.all().order_by('-created_at')
    serializer_class = StudentApplicationSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

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

class InviteCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = InviteCode
        fields = '__all__'

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'

class InviteCodeViewSet(viewsets.ModelViewSet):
    queryset = InviteCode.objects.all().order_by('-created_at')
    serializer_class = InviteCodeSerializer
    permission_classes = [permissions.IsAdminUser]

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
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
            return Profile.objects.all()
        return Profile.objects.filter(user=user)

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Course.objects.none()
        if user.is_staff:
            return Course.objects.all()
        
        try:
            profile = user.profile
            if profile.role == 'student':
                return Course.objects.filter(student=profile)
            elif profile.role == 'tutor':
                return Course.objects.filter(tutor=profile)
        except Profile.DoesNotExist:
            return Course.objects.none()
        
        return Course.objects.none()

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    
    def perform_create(self, serializer):
        course = serializer.validated_data.get('course')
        student = serializer.validated_data.get('student')
        tutor = serializer.validated_data.get('tutor')
        
        if course and not student:
            student = course.student
        if course and not tutor:
            tutor = course.tutor
            
        serializer.save(student=student, tutor=tutor, created_by=self.request.user.profile)
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Session.objects.none()
        if user.is_staff:
            return Session.objects.all()
        
        try:
            profile = user.profile
            if profile.role == 'student':
                return Session.objects.filter(student=profile)
            elif profile.role == 'tutor':
                return Session.objects.filter(tutor=profile)
        except Profile.DoesNotExist:
            return Session.objects.none()
        
        return Session.objects.none()

class StudentTutorAssignmentViewSet(viewsets.ModelViewSet):
    queryset = StudentTutorAssignment.objects.all()
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
            invite = InviteCode.objects.get(code=invite_code.upper(), role=role, is_used=False)
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
