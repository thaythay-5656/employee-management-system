from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import *
from rest_framework_simplejwt.views import TokenBlacklistView
from django.conf import settings
from django.conf.urls.static import static


router = DefaultRouter()
router.register(r'employee', views.EmployeeViewSet, basename='employee')
router.register(r'department', views.DepartmentViewSet, basename='department')
router.register(r'position', views.PositionViewSet, basename='position')
router.register(r'payroll', views.PayrollViewSet, basename='payroll')
router.register(r'leave', views.LeaveViewSet, basename='leave')
router.register(r'attendance', views.AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('api/', include(router.urls)), 
    path('', views.startproject),
    path('api-auth/', include('rest_framework.urls')),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', TokenBlacklistView.as_view(), name='logout'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)