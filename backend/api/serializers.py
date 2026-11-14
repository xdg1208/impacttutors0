from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import (
    Profile, UserRole, Course, StudentTutorAssignment, Session,
    InviteCode, StudentApplication, TutorApplication, ContactMessage,
    GlobalSetting, CourseSchedule
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')


class RegisterSerializer(serializers.Serializer):
    """
    Validates registration input. Registration is deliberately restricted to
    the student/tutor roles — admin accounts are provisioned via Django admin.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    full_name = serializers.CharField(max_length=255)
    role = serializers.ChoiceField(choices=[UserRole.STUDENT, UserRole.TUTOR])
    invite_code = serializers.CharField(max_length=20)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    age = serializers.IntegerField(required=False, allow_null=True, min_value=3, max_value=120)
    grade_level = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    curriculum = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    school_level = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    country = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    tutor_bio = serializers.CharField(max_length=2000, required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        # Full Django password validators (length, common passwords, similarity…)
        # checked against a transient user carrying the final username/email.
        from django.core.exceptions import ValidationError as DjangoValidationError
        email = attrs['email'].lower()
        tentative_user = User(username=email, email=email)
        try:
            validate_password(attrs['password'], user=tentative_user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Profile
        fields = ('id', 'role', 'full_name', 'phone', 'country', 'timezone',
                  'age', 'school_level', 'grade_level', 'curriculum',
                  'guardian_name', 'guardian_phone', 'tutor_bio',
                  'whatsapp_community_url', 'is_onboarded', 'created_at', 'updated_at', 'email')
        # `role` and `is_onboarded` are administrative controls — users must
        # never be able to self-promote or self-activate through this endpoint.
        read_only_fields = ('role', 'is_onboarded', 'created_at', 'updated_at')


class PublicCourseSerializer(serializers.ModelSerializer):
    """
    Read-only view of published courses for the marketing site.
    Deliberately excludes meet_link, students and every administrative
    field — those are for enrolled users only.
    """
    tutor_name = serializers.CharField(source='tutor.full_name', read_only=True)

    class Meta:
        model = Course
        fields = ('id', 'slug', 'title', 'category', 'description',
                  'seo_title', 'seo_description', 'tutor_name')


class CourseScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseSchedule
        fields = ('id', 'day_of_week', 'start_time', 'duration_minutes')

class CourseSerializer(serializers.ModelSerializer):
    student_names = serializers.SerializerMethodField()
    tutor_name = serializers.CharField(source='tutor.full_name', read_only=True)
    schedules = CourseScheduleSerializer(many=True, required=False)

    class Meta:
        model = Course
        fields = '__all__'

    def get_student_names(self, obj):
        # Iterating the prefetched relation uses the prefetch cache
        # (values_list would silently trigger a fresh query per course).
        return [student.full_name for student in obj.students.all()]

    def create(self, validated_data):
        schedules_data = validated_data.pop('schedules', [])
        students_data = validated_data.pop('students', [])
        # Enforce max 3 weekly schedules per course
        if len(schedules_data) > 3:
            raise serializers.ValidationError({"schedules": "A course can have at most 3 weekly sessions."})
        course = Course.objects.create(**validated_data)
        if students_data:
            course.students.set(students_data)
        for sd in schedules_data:
            # CourseSchedule post_save signal triggers sync_course_sessions —
            # no explicit call needed (it previously double-synced).
            CourseSchedule.objects.create(course=course, **sd)
        return course

    def update(self, instance, validated_data):
        schedules_data = validated_data.pop('schedules', None)
        students_data = validated_data.pop('students', None)
        # Validate schedules length when provided
        if schedules_data is not None and len(schedules_data) > 3:
            raise serializers.ValidationError({"schedules": "A course can have at most 3 weekly sessions."})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if students_data is not None:
            instance.students.set(students_data)

        if schedules_data is not None:
            instance.schedules.all().delete()
            for sd in schedules_data:
                # Each creation fires the post_save signal; the final sync
                # after the last schedule sees the complete timetable.
                CourseSchedule.objects.create(course=instance, **sd)

        return instance


class TutorApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorApplication
        fields = '__all__'
        # Submitters cannot set their own application status or timestamps.
        read_only_fields = ('status', 'created_at', 'updated_at')

class StudentApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentApplication
        fields = '__all__'
        # Submitters cannot set their own application status or timestamps.
        read_only_fields = ('status', 'created_at', 'updated_at')

class StudentTutorAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    tutor_name = serializers.CharField(source='tutor.full_name', read_only=True)

    class Meta:
        model = StudentTutorAssignment
        fields = '__all__'

class SessionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True, allow_null=True)
    tutor_name = serializers.CharField(source='tutor.full_name', read_only=True, allow_null=True)
    course_name = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Session
        fields = '__all__'
        # Administrative/session-state fields are managed exclusively by the
        # backend (creation flow, attendance endpoints, sync) — never writable
        # through a plain POST/PATCH.
        read_only_fields = (
            'status', 'created_by', 'created_at', 'updated_at',
            'student',
            'student_marked_present', 'student_feedback', 'student_marked_at',
            'tutor_marked_held', 'tutor_confirmed_student', 'tutor_marked_at',
        )

class InviteCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = InviteCode
        fields = '__all__'
        read_only_fields = ('is_used', 'created_at')

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
        read_only_fields = ('created_at',)


class GlobalSettingSerializer(serializers.ModelSerializer):
    """Full serializer — admin use only (includes telegram_chat_id)."""
    class Meta:
        model = GlobalSetting
        fields = ('id', 'whatsapp_group_link', 'student_whatsapp_group_link',
                  'telegram_chat_id', 'updated_at')


class PublicGlobalSettingSerializer(serializers.ModelSerializer):
    """Public serializer — exposes only the WhatsApp links, never the
    Telegram chat ID or other internal configuration."""
    class Meta:
        model = GlobalSetting
        fields = ('id', 'whatsapp_group_link', 'student_whatsapp_group_link')
