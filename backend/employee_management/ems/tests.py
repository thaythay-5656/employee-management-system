from django.test import TestCase

# Create your tests here.

"""
EMS Test Suite
==============
Covers:
  - Model logic (Payroll.save auto-calculates total_salary)
  - Authentication API  (login success / wrong password / missing fields)
  - Department API      (list, create — admin only)
  - Employee API        (admin CRUD, employee self-access only)
  - Attendance API      (create record, unique-together constraint)
  - Leave API           (employee creates request, manager approves)
  - Permissions         (employee cannot create departments)

Run with:
    python manage.py test ems
"""

from datetime import date
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from .models import Department, Position, Employee, Attendance, Leave, Payroll


# ─────────────────────────────────────────────────────────────────────────────
# Helper — build a full user+employee quickly
# ─────────────────────────────────────────────────────────────────────────────

def make_employee(username, password="pass1234", role="employee",
                  department=None, position=None):
    """Create a Django User + linked Employee profile and return both."""
    user = User.objects.create_user(
        username=username,
        password=password,
        first_name=username.capitalize(),
        last_name="Test",
        email=f"{username}@test.com",
    )
    dept = department or Department.objects.get_or_create(department_name="Engineering")[0]
    pos  = position  or Position.objects.get_or_create(
        position_name="Developer", defaults={"description": "Software developer"}
    )[0]
    emp = Employee.objects.create(
        user=user,
        role=role,
        gender="male",
        date_of_birth=date(1995, 1, 1),
        phone="0123456789",
        address="123 Main St",
        hire_date=date(2023, 1, 1),
        salary=50000,
        status="active",
        department=dept,
        position=pos,
    )
    return user, emp


# ─────────────────────────────────────────────────────────────────────────────
# 1. Model Tests
# ─────────────────────────────────────────────────────────────────────────────

class PayrollModelTest(TestCase):
    """Payroll.save() must auto-compute total_salary = basic + bonus - deduction."""

    def setUp(self):
        self.user, self.emp = make_employee("payroll_user")

    def test_total_salary_calculated_on_save(self):
        payroll = Payroll.objects.create(
            employee=self.emp,
            pay_date=date(2024, 1, 31),
            basic_salary=3000,
            bonus=500,
            deduction=200,
        )
        self.assertEqual(payroll.total_salary, 3300)

    def test_total_salary_zero_bonus_and_deduction(self):
        payroll = Payroll.objects.create(
            employee=self.emp,
            pay_date=date(2024, 2, 28),
            basic_salary=4000,
            bonus=0,
            deduction=0,
        )
        self.assertEqual(payroll.total_salary, 4000)

    def test_total_salary_updates_on_edit(self):
        payroll = Payroll.objects.create(
            employee=self.emp,
            pay_date=date(2024, 3, 31),
            basic_salary=2000,
            bonus=100,
            deduction=50,
        )
        payroll.bonus = 600
        payroll.save()
        self.assertEqual(payroll.total_salary, 2550)


class DepartmentModelTest(TestCase):
    def test_str_returns_name(self):
        dept = Department.objects.create(department_name="HR")
        self.assertEqual(str(dept), "HR")


class EmployeeModelTest(TestCase):
    def test_str_returns_full_name(self):
        user, emp = make_employee("john")
        user.first_name = "John"
        user.last_name = "Smith"
        user.save()
        self.assertEqual(str(emp), "John Smith")


# ─────────────────────────────────────────────────────────────────────────────
# 2. Authentication API Tests
# ─────────────────────────────────────────────────────────────────────────────

class AuthAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user, self.emp = make_employee("auth_user", role="admin")

    def test_login_success_returns_tokens(self):
        res = self.client.post("/api/login/", {"username": "auth_user", "password": "pass1234"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_login_wrong_password_returns_401(self):
        res = self.client.post("/api/login/", {"username": "auth_user", "password": "wrongpass"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_missing_fields_returns_400(self):
        res = self.client.post("/api/login/", {"username": "auth_user"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_protected_endpoint_without_token_returns_401(self):
        res = self.client.get("/api/employee/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Department API Tests
# ─────────────────────────────────────────────────────────────────────────────

class DepartmentAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user, self.admin_emp = make_employee("dept_admin", role="admin")
        self.emp_user, self.emp_emp     = make_employee("dept_emp",   role="employee")

        # Authenticate admin
        res = self.client.post("/api/login/", {"username": "dept_admin", "password": "pass1234"})
        self.admin_token = res.data["access"]

        # Authenticate regular employee
        res = self.client.post("/api/login/", {"username": "dept_emp", "password": "pass1234"})
        self.emp_token = res.data["access"]

    def _auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_admin_can_list_departments(self):
        self._auth(self.admin_token)
        res = self.client.get("/api/department/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_admin_can_create_department(self):
        self._auth(self.admin_token)
        res = self.client.post("/api/department/", {"department_name": "Finance"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["department_name"], "Finance")

    def test_employee_cannot_create_department(self):
        self._auth(self.emp_token)
        res = self.client.post("/api/department/", {"department_name": "Marketing"})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_delete_department(self):
        self._auth(self.admin_token)
        dept = Department.objects.create(department_name="Temp")
        res = self.client.delete(f"/api/department/{dept.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Employee API Tests
# ─────────────────────────────────────────────────────────────────────────────

class EmployeeAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user, self.admin_emp = make_employee("emp_admin", role="admin")
        self.emp_user,   self.emp_emp   = make_employee("emp_regular", role="employee")

        res = self.client.post("/api/login/", {"username": "emp_admin",   "password": "pass1234"})
        self.admin_token = res.data["access"]

        res = self.client.post("/api/login/", {"username": "emp_regular", "password": "pass1234"})
        self.emp_token = res.data["access"]

    def _auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_admin_can_list_all_employees(self):
        self._auth(self.admin_token)
        res = self.client.get("/api/employee/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 2)

    def test_employee_sees_only_self(self):
        self._auth(self.emp_token)
        res = self.client.get("/api/employee/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Regular employee should only see their own record
        ids = [e["id"] for e in res.data]
        self.assertIn(self.emp_emp.id, ids)
        self.assertNotIn(self.admin_emp.id, ids)

    def test_employee_cannot_delete_employee(self):
        self._auth(self.emp_token)
        res = self.client.delete(f"/api/employee/{self.admin_emp.id}/")
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])


# ─────────────────────────────────────────────────────────────────────────────
# 5. Attendance API Tests
# ─────────────────────────────────────────────────────────────────────────────

class AttendanceAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user, self.admin_emp = make_employee("att_admin", role="admin")

        res = self.client.post("/api/login/", {"username": "att_admin", "password": "pass1234"})
        self.token = res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_create_attendance_record(self):
        res = self.client.post("/api/attendance/", {
            "employee": self.admin_emp.id,
            "attendance_date": "2024-06-01",
            "check_in": "08:00:00",
            "check_out": "17:00:00",
            "status": "present",
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_duplicate_attendance_on_same_day_fails(self):
        Attendance.objects.create(
            employee=self.admin_emp,
            attendance_date=date(2024, 6, 2),
            status="present",
        )
        res = self.client.post("/api/attendance/", {
            "employee": self.admin_emp.id,
            "attendance_date": "2024-06-02",
            "status": "late",
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_attendance_returns_200(self):
        res = self.client.get("/api/attendance/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Leave API Tests
# ─────────────────────────────────────────────────────────────────────────────

class LeaveAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.mgr_user,  self.mgr_emp  = make_employee("leave_mgr", role="manager")
        self.emp_user,  self.emp_emp  = make_employee("leave_emp", role="employee")

        res = self.client.post("/api/login/", {"username": "leave_mgr", "password": "pass1234"})
        self.mgr_token = res.data["access"]

        res = self.client.post("/api/login/", {"username": "leave_emp", "password": "pass1234"})
        self.emp_token = res.data["access"]

    def _auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_employee_can_create_leave_request(self):
        self._auth(self.emp_token)
        res = self.client.post("/api/leave/", {
            "employee": self.emp_emp.id,
            "leave_type": "annual",
            "start_date": "2024-07-01",
            "end_date": "2024-07-05",
            "reason": "Family vacation",
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "pending")

    def test_manager_can_approve_leave(self):
        leave = Leave.objects.create(
            employee=self.emp_emp,
            leave_type="sick",
            start_date=date(2024, 7, 10),
            end_date=date(2024, 7, 11),
            reason="Flu",
            status="pending",
        )
        self._auth(self.mgr_token)
        res = self.client.patch(f"/api/leave/{leave.id}/", {"status": "approved"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "approved")

    def test_employee_only_sees_own_leave(self):
        # Create leave for the manager too
        Leave.objects.create(
            employee=self.mgr_emp,
            leave_type="annual",
            start_date=date(2024, 8, 1),
            end_date=date(2024, 8, 3),
            reason="Holiday",
        )
        Leave.objects.create(
            employee=self.emp_emp,
            leave_type="sick",
            start_date=date(2024, 8, 5),
            end_date=date(2024, 8, 6),
            reason="Sick",
        )
        self._auth(self.emp_token)
        res = self.client.get("/api/leave/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        employee_ids = {r["employee"] for r in res.data}
        self.assertEqual(employee_ids, {self.emp_emp.id})