#!/bin/sh
set -e

python manage.py migrate --noinput

python manage.py shell <<'PY'
from django.contrib.auth.models import User
from ems.models import Department, Position, Employee

if not User.objects.filter(username='admin').exists():
    print('Creating default admin user: admin / pass1234')
    user = User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='pass1234',
    )

    dept, _ = Department.objects.get_or_create(
        department_name='Administration'
    )
    pos, _ = Position.objects.get_or_create(
        position_name='Administrator',
        defaults={'description': 'Administrator role'},
    )

    Employee.objects.create(
        user=user,
        role='admin',
        gender='male',
        date_of_birth='1990-01-01',
        phone='0000000000',
        address='Admin Office',
        hire_date='2024-01-01',
        salary=1,
        status='active',
        department=dept,
        position=pos,
    )
PY

exec gunicorn employee_management.wsgi:application --bind 0.0.0.0:8000 --workers 3
