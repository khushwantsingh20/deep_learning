from django.conf.urls import url

from .views import add_transaction_view
from .views import add_view
from .views import list_view
from .views import sql_error_view

app_name = "test_django_cypress"

urlpatterns = [
    url(r"^add/(?P<data>.*)/$", add_view, name="add"),
    url(
        r"^add_transaction/(?P<data>.*)/$", add_transaction_view, name="add_transaction"
    ),
    url(r"^sql_error/(?P<data>.*)/$", sql_error_view, name="sql_error"),
    url(r"^list/$", list_view, name="list"),
]
