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
from rest_framework.parsers import MultiPartParser, FormParser

# Create your views here.

@api_view(['GET'])
@permission_classes([AllowAny])
def startproject(request):
    return HttpResponse("Started Project")


class EmployeeViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser]

    def _unflatten_multipart(self, request):
        result = {}
        nested = {}

        for key, value in request.data.items():
            if '.' in key:
                parent, child = key.split('.', 1)
                nested.setdefault(parent, {})
                nested[parent][child] = value
            else:
                result[key] = value

        result.update(nested)

        for key, file in request.FILES.items():
            result[key] = file

        return result

    def update(self, request, *args, **kwargs):
        request._full_data = self._unflatten_multipart(request)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        request._full_data = self._unflatten_multipart(request)
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

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
            pk = self.kwargs.get('pk')
            is_self = pk and str(self.request.user.employee.pk) == str(pk)
            if is_self:
                return [IsAuthenticated(), IsSelfEmployee()]
            return [IsAuthenticated(), IsManagerOrAdmin()]

        if role == 'employee':
            return [IsAuthenticated(), IsSelfEmployee()]

        return [IsAuthenticated()]

    def get_queryset(self):
        role = self._get_role()

        if role == 'admin':
            return Employee.objects.all()

        if role == 'manager':
            return Employee.objects.filter(
                models.Q(role='employee') | models.Q(user=self.request.user)
            )

        if role == 'employee':
            return Employee.objects.filter(user=self.request.user)

        return Employee.objects.none()

    def get_serializer_class(self):
        role = self._get_role()

        if self.action in ['update', 'partial_update']:
            # Check if they're editing themselves
            pk = self.kwargs.get('pk')
            is_self = str(self.request.user.employee.pk) == str(pk)

            if is_self:
                return SelfUpdateEmployeeSerializer  # same restrictions for everyone editing self

            if role == 'manager':
                return ManagerUpdateEmployeeSerializer  # manager editing a subordinate

            if role == 'admin':
                return EmployeeSerializer  # admin editing anyone

        return EmployeeSerializer
    
    def get_object(self):
        obj = get_object_or_404(Employee, pk=self.kwargs['pk'])
        self.check_object_permissions(self.request, obj)  # ← triggers has_object_permission
        return obj

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUserRole()]
        return [IsAuthenticated()] 

class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUserRole()]
        return [IsAuthenticated()]    

class PayrollViewSet(CreateModelMixin, ListModelMixin, GenericViewSet):
    queryset = Payroll.objects.all()
    serializer_class = PayrollSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsManagerOrAdmin()]  # only managers/admins create payroll
        return [IsAuthenticated()]  # anyone authenticated can list/read

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'employee') and user.employee.role in ['admin', 'manager']:
            return Payroll.objects.all()
        # Employees only see their own payslips
        return Payroll.objects.filter(employee__user=user)

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
    
class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticated, IsManagerOrAdmin] 

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsManagerOrAdmin()]
        return [IsAuthenticated()]
    



    
        
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
        




from django.core.mail import send_mail
from django.contrib.auth.models import User
from .otp_store import generate_otp, verify_otp

class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        if not email:
            return Response({"error": "Email required"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            code = generate_otp(email)
            try:
                send_mail(
                    subject="Your Nimbus HR password reset code",
                    message=f"Your OTP code is: {code}\n\nThis code expires in 5 minutes.",
                    from_email=None,
                    recipient_list=[email],
                    fail_silently=False,  # raises exception on failure
                )
                print(f"[OTP] Email sent to {email}")
            except Exception as e:
                print(f"[OTP ERROR] Failed to send email: {e}")
                return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            print(f"[OTP] Email {email} not found in database")

        return Response({"message": "If this email exists, a code was sent."})


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        code = request.data.get("code", "").strip()
        new_password = request.data.get("new_password", "").strip()

        if not all([email, code, new_password]):
            return Response({"error": "email, code and new_password are required"}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 4:
            return Response({"error": "Password too short"}, status=status.HTTP_400_BAD_REQUEST)

        if not verify_otp(email, code):
            return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            return Response({"message": "Password reset successful"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)