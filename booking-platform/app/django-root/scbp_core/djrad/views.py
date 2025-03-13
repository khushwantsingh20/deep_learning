from django.contrib.auth import authenticate
from django.contrib.auth import login
from djrad_rest.viewsets import LoginViewSet as BaseLoginViewSet
from rest_framework import status
from rest_framework.response import Response

from scbp_core.models.user import MobileDeviceToken


class LoginViewSet(BaseLoginViewSet):
    def login(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        token = request.data.get("token", None)
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            if token and token != "(null)":
                if not MobileDeviceToken.objects.filter(
                    user=user, token=token
                ).exists():
                    MobileDeviceToken(user=user, token=token).save()
            required_user_types = self.site.get_supported_user_types()
            user = user.get_profile()
            if user.__class__ not in required_user_types:
                url = self.site.get_unsupported_user_type_redirect(user)
                return Response({"redirect_to": url})
            serializer = self.get_serializer(user)
            response = {"user": serializer.data}
            extra_data = self.site.get_extra_login_response_data(request)
            response.update(extra_data)
            if self.site:
                # Return the updated djradContext to refresh permissions
                response.update(
                    {"djradContext": self.site.get_runtime_context(request)}
                )
            return Response(response)
        else:
            status_code = status.HTTP_400_BAD_REQUEST
            return Response(
                {"_error": "Your username or password did not match"},
                status=status_code,
            )
