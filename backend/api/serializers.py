from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Course, StudentTutorAssignment, Session, InviteCode, StudentApplication, TutorApplication, ContactMessage

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

class CourseSerializer(serializers.ModelSerializer):
    student_names = serializers.SerializerMethodField()
    tutor_name = serializers.CharField(source='tutor.full_name', read_only=True)
    
    class Meta:
        model = Course
        fields = '__all__'

    def get_student_names(self, obj):
        return [student.full_name for student in obj.students.all()]

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
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    tutor_name = serializers.CharField(source='tutor.full_name', read_only=True)
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
