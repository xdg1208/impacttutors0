from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Profile, Course, StudentTutorAssignment, Session, 
    InviteCode, StudentApplication, TutorApplication, ContactMessage,
    GlobalSetting, CourseSchedule
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Profile
        fields = ('id', 'role', 'full_name', 'phone', 'country', 'timezone', 
                  'age', 'school_level', 'grade_level', 'curriculum', 
                  'guardian_name', 'guardian_phone', 'tutor_bio', 
                  'whatsapp_community_url', 'is_onboarded', 'created_at', 'updated_at', 'email')

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
            CourseSchedule.objects.create(course=course, **sd)
        # Import dynamically to avoid circular dependency
        from .views import sync_course_sessions
        sync_course_sessions(course)
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
                CourseSchedule.objects.create(course=instance, **sd)
                
        from .views import sync_course_sessions
        sync_course_sessions(instance)
        return instance


class TutorApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorApplication
        fields = '__all__'

class StudentApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentApplication
        fields = '__all__'

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

class InviteCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = InviteCode
        fields = '__all__'

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'

class GlobalSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSetting
        fields = '__all__'



