from rest_framework import serializers
from .models import *
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'first_name', 'last_name', 'email', 'is_active']

    def get_extra_kwargs(self):
        extra_kwargs = super().get_extra_kwargs()
        # When updating, exclude the current user from the unique username check
        if self.instance:
            extra_kwargs.setdefault('username', {})
            extra_kwargs['username']['validators'] = []
        return extra_kwargs


class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.partial:
            user_instance = getattr(self.instance, 'user', None)
            self.fields['user'] = UserSerializer(instance=user_instance, partial=True)

    class Meta:
        model = Employee
        fields = '__all__'

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        password = user_data.pop('password', None) or None
        user = User.objects.create_user(password=password, **user_data)
        return Employee.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)

        if user_data:
            user_instance = instance.user
            password = user_data.pop('password', None)

            for attr, value in user_data.items():
                setattr(user_instance, attr, value)

            if password:
                user_instance.set_password(password)

            user_instance.save()

        return super().update(instance, validated_data)


class SelfUpdateEmployeeSerializer(EmployeeSerializer):
    """Employees updating their own record — restricted fields are read-only."""

    class Meta(EmployeeSerializer.Meta):
        read_only_fields = ['role', 'position', 'department', 'salary', 'hire_date']


class ManagerUpdateEmployeeSerializer(EmployeeSerializer):
    """Managers can update employees but cannot change role."""

    class Meta(EmployeeSerializer.Meta):
        read_only_fields = ['role', 'hire_date', 'salary']


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = '__all__'


class PayrollSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payroll
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'


class LeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Leave
        fields = '__all__'


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = '__all__'


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(
        write_only=True,
        required=True,
        error_messages={"blank": "Username cannot be empty."}
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        error_messages={"blank": "Password cannot be empty."}
    )