from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, "userprofile")
            and request.user.userprofile.role == "admin"
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsLagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, "userprofile", None)
        return (
            request.user.is_authenticated
            and profile
            and profile.role in ["admin", "lager"]
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsEinkaufOrAdmin:
    def has_permission(self, request, view):
        profile = getattr(request.user, "userprofile", None)
        return bool(
            request.user
            and request.user.is_authenticated
            and profile
            and profile.role in ["admin", "einkauf"]
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsForkliftOrAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        profile = getattr(request.user, "userprofile", None)

        return bool(
            profile
            and profile.role in ["admin", "stapler"]
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

