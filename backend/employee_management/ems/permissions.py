# your_app/permissions.py
from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'employee') and 
            request.user.employee.role == 'admin'
        )

class IsManagerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'employee') and
            request.user.employee.role in ['manager', 'admin']
        )

    def has_object_permission(self, request, view, obj):
        role = request.user.employee.role

        if role == 'admin':
            return True

        if role == 'manager':
            return obj.role == 'employee'

        return False


class IsSelfEmployee(permissions.BasePermission):
    ALLOWED_ACTIONS = ['retrieve', 'update', 'partial_update', 'list']

    def has_permission(self, request, view):
        if view.action not in self.ALLOWED_ACTIONS:
            return False
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'employee') and
            request.user.employee.role in ['employee', 'manager']  # ← add manager
        )

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user