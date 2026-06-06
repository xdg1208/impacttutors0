from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
import uuid

class UserRole(models.TextChoices):
    STUDENT = 'student', _('Student')
    TUTOR = 'tutor', _('Tutor')
    ADMIN = 'admin', _('Admin')

class SessionStatus(models.TextChoices):
    SCHEDULED = 'scheduled', _('Scheduled')
    COMPLETED = 'completed', _('Completed')
    CANCELLED = 'cancelled', _('Cancelled')
    NO_SHOW = 'no_show', _('No Show')

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=UserRole.choices, default=UserRole.STUDENT)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, default='Nigeria')
    timezone = models.CharField(max_length=100, default='Africa/Lagos')
    
    # Student specific fields
    age = models.IntegerField(blank=True, null=True)
    school_level = models.CharField(max_length=100, blank=True, null=True)
    grade_level = models.CharField(max_length=100, blank=True, null=True)
    curriculum = models.CharField(max_length=100, blank=True, null=True)
    guardian_name = models.CharField(max_length=255, blank=True, null=True)
    guardian_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Tutor specific fields
    tutor_bio = models.TextField(blank=True, null=True)
    whatsapp_community_url = models.URLField(blank=True, null=True)
    
    is_onboarded = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.role})"

class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    description = models.TextField()
    students = models.ManyToManyField(Profile, blank=True, related_name='courses_enrolled')
    tutor = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses_taught')
    meet_link = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, default='active')
    is_published = models.BooleanField(default=False)
    seo_title = models.CharField(max_length=255, blank=True, null=True)
    seo_description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title or "Untitled Course"

class StudentTutorAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='tutor_assignments')
    tutor = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='student_assignments')
    is_active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = _('Student-Tutor Assignment')
        verbose_name_plural = _('Student-Tutor Assignments')

    def __str__(self):
        return f"{self.student.full_name} -> {self.tutor.full_name}"

class Session(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='student_sessions', null=True, blank=True)
    tutor = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='tutor_sessions', null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    start_time = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    meet_link = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=SessionStatus.choices, default=SessionStatus.SCHEDULED)
    created_by = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, related_name='created_sessions')
    
    # Attendance fields
    student_marked_present = models.BooleanField(default=False)
    student_feedback = models.TextField(blank=True, null=True)
    student_marked_at = models.DateTimeField(blank=True, null=True)
    tutor_marked_held = models.BooleanField(default=False)
    tutor_confirmed_student = models.BooleanField(default=False)
    tutor_marked_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        title = self.course.title if self.course else "Unknown Course"
        return f"{title} session on {self.start_time or 'TBD'}"

class InviteCode(models.Model):
    code = models.CharField(max_length=20, unique=True, blank=True)
    role = models.CharField(max_length=10, choices=UserRole.choices, default=UserRole.STUDENT)
    target_email = models.EmailField(blank=True, null=True)
    is_used = models.BooleanField(default=False)
    
    # Links to applications (The "Code as ID" logic)
    student_application = models.ForeignKey('StudentApplication', on_delete=models.SET_NULL, null=True, blank=True, related_name='registration_codes')
    tutor_application = models.ForeignKey('TutorApplication', on_delete=models.SET_NULL, null=True, blank=True, related_name='registration_codes')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.code:
            import random
            import string
            length = 8
            while True:
                new_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
                if not InviteCode.objects.filter(code=new_code).exists():
                    self.code = new_code
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} ({self.role} - {'Used' if self.is_used else 'Available'})"

class StudentApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('contacted', 'Contacted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    parent_name = models.CharField(max_length=255)
    student_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    grade_level = models.CharField(max_length=100)
    curriculum = models.CharField(max_length=100)
    subjects = models.JSONField(default=list) # List of subjects
    message = models.TextField(blank=True, null=True)
    
    # Contact Tracking
    preferred_contact_method = models.CharField(max_length=50, default='Email') # Email, WhatsApp, Phone
    contact_detail = models.CharField(max_length=255, blank=True, null=True) # The actual phone/whatsapp number
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student_name} Application ({self.status})"

class TutorApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, null=True)
    subjects = models.JSONField(default=list) # List of subjects
    experience = models.TextField(blank=True, null=True)
    
    # Contact Tracking
    preferred_contact_method = models.CharField(max_length=50, default='Email')
    contact_detail = models.CharField(max_length=255, blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.status})"

class ContactMessage(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.name}: {self.subject}"

class GlobalSetting(models.Model):
    whatsapp_group_link = models.URLField(max_length=500, blank=True, null=True) # Tutor WhatsApp Link
    student_whatsapp_group_link = models.URLField(max_length=500, blank=True, null=True) # Student WhatsApp Link
    telegram_chat_id = models.CharField(max_length=255, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Global Setting')
        verbose_name_plural = _('Global Settings')

    def __str__(self):
        return "Global Settings"

class PasswordResetOTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"OTP for {self.email} ({'Used' if self.is_used else 'Active'})"

class CourseSchedule(models.Model):
    DAYS_OF_WEEK = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.CharField(max_length=15, choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    duration_minutes = models.IntegerField(default=60)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course.title} - {self.get_day_of_week_display()} at {self.start_time}"
