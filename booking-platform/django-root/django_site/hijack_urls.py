from django.urls import path
from hijack import views

from django_site.decorators import parse_json_request

app_name = "hijack"
urlpatterns = [
    path(
        "acquire/", parse_json_request(views.AcquireUserView.as_view()), name="acquire"
    ),
    path("release/", views.ReleaseUserView.as_view(), name="release"),
]
