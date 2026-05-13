from django.urls import path, include
from rest_framework.routers import DefaultRouter
    ProfileViewSet, CourseViewSet, SessionViewSet, 
    StudentTutorAssignmentViewSet, InviteCodeViewSet,
    TutorApplicationViewSet, StudentApplicationViewSet, RegisterView,
    ContactMessageViewSet
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

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
]
