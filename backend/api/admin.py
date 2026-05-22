from django.contrib import admin
from .models import (
    Profile, Course, StudentTutorAssignment, Session, 
    InviteCode, StudentApplication, TutorApplication, 
    ContactMessage, GlobalSetting
)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'role', 'country', 'created_at')
    list_filter = ('role', 'is_onboarded', 'country')
    search_fields = ('full_name', 'user__username', 'user__email')

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'status', 'is_published', 'created_at')
    list_filter = ('status', 'is_published', 'category')
    search_fields = ('title', 'description', 'tutor__full_name')

@admin.register(StudentTutorAssignment)
class StudentTutorAssignmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'tutor', 'is_active', 'assigned_at')
    list_filter = ('is_active',)
    search_fields = ('student__full_name', 'tutor__full_name')

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('course', 'start_time', 'duration_minutes', 'status', 'tutor', 'student')
    list_filter = ('status', 'start_time')
    search_fields = ('course__title', 'tutor__full_name', 'student__full_name')

@admin.register(InviteCode)
class InviteCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'role', 'is_used', 'created_at')
    list_filter = ('role', 'is_used')
    search_fields = ('code', 'target_email')

@admin.register(StudentApplication)
class StudentApplicationAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'phone', 'grade_level', 'status', 'created_at')
    list_filter = ('status', 'grade_level')
    search_fields = ('student_name', 'parent_name', 'email')

@admin.register(TutorApplication)
class TutorApplicationAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('full_name', 'email')

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at')
    search_fields = ('name', 'email', 'subject')

@admin.register(GlobalSetting)
class GlobalSettingAdmin(admin.ModelAdmin):
    list_display = ('whatsapp_group_link', 'telegram_chat_id', 'updated_at')
