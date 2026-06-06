from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProfileViewSet, CourseViewSet, SessionViewSet, 
    StudentTutorAssignmentViewSet, InviteCodeViewSet,
    TutorApplicationViewSet, StudentApplicationViewSet, RegisterView,
    ContactMessageViewSet, ChangePasswordView, GlobalSettingViewSet,
    CourseScheduleViewSet, ForgotPasswordView, ResetPasswordView
)

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'sessions', SessionViewSet)
router.register(r'assignments', StudentTutorAssignmentViewSet)
router.register(r'invites', InviteCodeViewSet)
router.register(r'tutor-applications', TutorApplicationViewSet)
router.register(r'student-applications', StudentApplicationViewSet)
router.register(r'contact-messages', ContactMessageViewSet)
router.register(r'settings', GlobalSettingViewSet, basename='settings')
router.register(r'schedules', CourseScheduleViewSet, basename='schedules')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset_password'),
]

