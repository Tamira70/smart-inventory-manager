from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "userprofile")
            and request.user.userprofile.role == "admin"
        )


class IsLagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, "userprofile", None)
        return (
            request.user.is_authenticated
            and profile
            and profile.role in ["admin", "lager"]
        )