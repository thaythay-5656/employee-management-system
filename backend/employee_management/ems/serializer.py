from rest_framework import serializers
from .models import *
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'first_name', 'last_name', 'email']

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer() # Tells serializer to expect a dictionary layout

    class Meta:
        model = Employee
        fields = '__all__'

    def create(self, validated_data):
        # 1. Pop the user dictionary out of the employee data payload
        user_data = validated_data.pop('user')
        
        # 2. Explicitly build the core Django User row first
        user = User.objects.create_user(**user_data)
        
        # 3. Create the Employee profile linked to that new user instance row
        employee = Employee.objects.create(user=user, **validated_data)
        return employee

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


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(
        write_only=True, 
        required=True,
        error_messages={"blank": "Username cannot be empty."}
    )
    password = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}, # Hides input in the browsable API
        error_messages={"blank": "Password cannot be empty."}
    )