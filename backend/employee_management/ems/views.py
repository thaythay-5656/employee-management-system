from django.shortcuts import render
from django.http import HttpResponse
from .serializer import *
from .models import *
from rest_framework import viewsets
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import CreateModelMixin, ListModelMixin, UpdateModelMixin
from .permissions import *
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

# Create your views here.

@api_view(['GET'])
@permission_classes([AllowAny])
def startproject(request):
    return HttpResponse("Started Project")


class EmployeeViewSet(viewsets.ModelViewSet):

    def _get_role(self):
        """Safe helper — returns role string or None."""
        user = self.request.user
        if user and user.is_authenticated and hasattr(user, 'employee'):
            return user.employee.role
        return None

    def get_permissions(self):
        role = self._get_role()

        if role == 'admin':
            return [IsAuthenticated(), IsManagerOrAdmin()]

        if role == 'manager':
            return [IsAuthenticated(), IsManagerOrAdmin()]

        if role == 'employee':
            return [IsAuthenticated(), IsSelfEmployee()]

        # Unauthenticated or no employee profile — block cleanly
        return [IsAuthenticated()]

    def get_queryset(self):
        role = self._get_role()

        if role == 'admin':
            return Employee.objects.all()

        if role == 'manager':
            return Employee.objects.filter(role='employee')

        if role == 'employee':
            return Employee.objects.filter(user=self.request.user)

        return Employee.objects.none()

    def get_serializer_class(self):
        role = self._get_role()

        if role == 'manager' and self.action in ['update', 'partial_update']:
            return ManagerUpdateEmployeeSerializer

        if role == 'employee' and self.action in ['update', 'partial_update']:
            return SelfUpdateEmployeeSerializer

        return EmployeeSerializer
    
    def get_object(self):
        obj = get_object_or_404(Employee, pk=self.kwargs['pk'])
        self.check_object_permissions(self.request, obj)  # ← triggers has_object_permission
        return obj

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]

class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]    

class PayrollViewSet(CreateModelMixin, ListModelMixin, GenericViewSet):
    queryset = Payroll.objects.all()
    serializer_class = PayrollSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]  

class LeaveViewSet(CreateModelMixin, ListModelMixin, UpdateModelMixin, GenericViewSet):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if hasattr(user, 'employee') and user.employee.role in ['admin', 'manager']:
            return Leave.objects.all()

        return Leave.objects.filter(employee__user=user)

class AttendanceViewSet(CreateModelMixin, ListModelMixin, UpdateModelMixin, GenericViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'employee') and user.employee.role in ['admin', 'manager']:
            return Attendance.objects.all()
        return Attendance.objects.filter(employee__user=user)
    



    
        
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data = request.data)

        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data.get('username')
        password = serializer.validated_data.get('password')

        user = authenticate(username=username, password=password)

        if user is not None:

            if user.is_active:

                refresh = RefreshToken.for_user(user)

                return Response({
                    "message": "Login successful",
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.employee.role
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Account is disabled"}, status=status.HTTP_403_FORBIDDEN)
            
        else:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)