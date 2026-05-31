from django.contrib import admin
from . models import *

# Register your models here.

admin.site.register(Employee)
admin.site.register(Department)
admin.site.register(Position)
admin.site.register(Leave)
admin.site.register(Payroll)
admin.site.register(Attendance)