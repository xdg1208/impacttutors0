import os
import secrets
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
from django.contrib.auth.models import User
from api.models import Profile, Course, StudentTutorAssignment, Session, UserRole, SessionStatus
from datetime import timedelta
from django.utils import timezone


def seed():
    # Development-only tool: refuse to run against a production instance.
    if not settings.DEBUG:
        print("Refusing to seed: DEBUG=False (this would modify a production database).")
        return

    print("Seeding database...")
    credentials = {}

    def make_user(username, role, profile_defaults):
        password = 'dev-' + secrets.token_urlsafe(9)
        user, _ = User.objects.get_or_create(username=username, email=username)
        user.set_password(password)
        user.save()
        Profile.objects.get_or_create(user=user, defaults={
            'role': role,
            'is_onboarded': True,
            **profile_defaults,
        })
        credentials[username] = password
        return user

    # 1. Admin
    admin_user = make_user(
        'admin@impacttutors.com', UserRole.ADMIN,
        {'full_name': 'System Administrator'},
    )
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()

    # 2. Tutors
    tutor1_profile = make_user(
        'tutor1@example.com', UserRole.TUTOR,
        {'full_name': 'John Doe', 'tutor_bio': 'Experienced Math and Physics tutor with 10 years of experience.'},
    ).profile
    tutor2_profile = make_user(
        'tutor2@example.com', UserRole.TUTOR,
        {'full_name': 'Sarah Smith', 'is_onboarded': False, 'tutor_bio': 'Biology specialist.'},
    ).profile

    # 3. Students
    student1_profile = make_user(
        'student1@example.com', UserRole.STUDENT,
        {'full_name': 'Michael Jordan', 'grade_level': 'GCSE', 'curriculum': 'British'},
    ).profile
    student2_profile = make_user(
        'student2@example.com', UserRole.STUDENT,
        {'full_name': 'Jane Doe', 'is_onboarded': False, 'grade_level': 'Year 9', 'curriculum': 'Nigerian'},
    ).profile

    # 4. Courses (students is a M2M — assign with .set(), not a kwarg)
    math_course, _ = Course.objects.update_or_create(
        slug='gcse-mathematics',
        defaults={
            'title': 'GCSE Mathematics',
            'category': 'Mathematics',
            'description': 'Comprehensive GCSE Math preparation.',
            'is_published': True,
            'tutor': tutor1_profile,
            'meet_link': 'https://meet.google.com/abc-defg-hij',
        }
    )
    math_course.students.set([student1_profile])

    physics_course, _ = Course.objects.update_or_create(
        slug='physics-advanced',
        defaults={
            'title': 'Advanced Physics',
            'category': 'Science',
            'description': 'Advanced Physics concepts for high school students.',
            'is_published': True,
            'tutor': tutor1_profile,
            'meet_link': 'https://meet.google.com/xyz-pdqr-lmn',
        }
    )
    physics_course.students.set([student1_profile])

    # 5. Assignments
    StudentTutorAssignment.objects.update_or_create(
        student=student1_profile,
        tutor=tutor1_profile,
        defaults={'is_active': True}
    )

    # 6. Sessions
    now = timezone.now()

    Session.objects.update_or_create(
        student=student1_profile,
        tutor=tutor1_profile,
        course=math_course,
        start_time=now + timedelta(days=1, hours=2),
        defaults={
            'duration_minutes': 60,
            'meet_link': 'https://meet.google.com/abc-defg-hij',
            'status': SessionStatus.SCHEDULED
        }
    )

    Session.objects.update_or_create(
        student=student1_profile,
        tutor=tutor1_profile,
        course=math_course,
        start_time=now - timedelta(days=2),
        defaults={
            'duration_minutes': 60,
            'meet_link': 'https://meet.google.com/xyz-pdqr-lmn',
            'status': SessionStatus.COMPLETED
        }
    )

    print("Database seeded successfully!")
    print("\nGenerated DEV credentials (not saved anywhere — copy them now):")
    for username, password in credentials.items():
        print(f"  {username}: {password}")


if __name__ == '__main__':
    seed()
