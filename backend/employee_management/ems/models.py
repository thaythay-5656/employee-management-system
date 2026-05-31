from django.db import models
from django.contrib.auth.models import User


# =========================
# ENUM CHOICES
# =========================

EMPLOYMENT_STATUS = [
    ('active', 'Active'),
    ('inactive', 'Inactive'),
    ('terminated', 'Terminated'),
]

LEAVE_STATUS = [
    ('pending', 'Pending'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
]

ATTENDANCE_STATUS = [
    ('present', 'Present'),
    ('absent', 'Absent'),
    ('late', 'Late'),
    ('on_leave', 'On Leave'),
]

ROLE_CHOICES = [
    ('admin', 'Admin'),
    ('manager', 'Manager'),
    ('employee', 'Employee'),
]

GENDER_CHOICES = [
    ('male', 'Male'),
    ('female', 'Female'),
    ('other', 'Other'),
]

LEAVE_TYPE_CHOICES = [
    ('annual', 'Annual Leave'),
    ('sick', 'Sick Leave'),
    ('maternity', 'Maternity Leave'),
    ('emergency', 'Emergency Leave'),
    ('unpaid', 'Unpaid Leave'),
    ('other', 'Other')
]

# =========================
# DEPARTMENT
# =========================

class Department(models.Model):
    department_name = models.CharField(max_length=100)

    def __str__(self):
        return self.department_name


# =========================
# POSITION
# =========================

class Position(models.Model):
    position_name = models.CharField(max_length=100)
    description = models.TextField()

    def __str__(self):
        return self.position_name

# =========================
# EMPLOYEE
# =========================

class Employee(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')

    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES
    )

    date_of_birth = models.DateField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    hire_date = models.DateField()

    salary = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_STATUS,
        default='active'
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE
    )

    position = models.ForeignKey(
        Position,
        on_delete=models.CASCADE
    )

    def __str__(self):
        return self.user.get_full_name() or self.user.username

# =========================
# ATTENDANCE
# =========================

class Attendance(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE
    )
    attendance_date = models.DateField()

    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=ATTENDANCE_STATUS,
        default='present'
    )

    def __str__(self):
        return f"{self.employee} - {self.attendance_date}"
    
    
    class Meta:
        unique_together = ('employee', 'attendance_date')


# =========================
# LEAVES
# =========================

class Leave(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='leave_requests'
    )

    leave_type = models.CharField(
        max_length=50,
        choices=LEAVE_TYPE_CHOICES
    )

    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=LEAVE_STATUS,
        default='pending'
    )

    approved_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_leaves'
    )

    requested_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.employee} - {self.leave_type}"
    
    class Meta:
        ordering = ['-requested_at']


# =========================
# PAYROLL
# =========================

class Payroll(models.Model):
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE
    )

    pay_date = models.DateField()

    basic_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    bonus = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    deduction = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    total_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        editable=False
    )

    def __str__(self):
        return f"{self.employee} - {self.pay_date}"
    
    def save(self, *args, **kwargs):
        self.total_salary = (
            (self.basic_salary or 0) +
            (self.bonus or 0) -
            (self.deduction or 0)
        )
        super().save(*args, **kwargs)