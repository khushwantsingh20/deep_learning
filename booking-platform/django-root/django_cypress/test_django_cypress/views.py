from typing import Optional

from django.db import connection
from django.db import transaction
from django.db.utils import DatabaseError
from django.http import HttpRequest
from django.http import HttpResponse
from django.http import JsonResponse

from .businesslogic import add
from .models import TestModel


def add_view(request: HttpRequest, data: Optional[str] = None) -> HttpResponse:
    """
    Saves a new record
    """
    obj = add(data)
    return JsonResponse({"data": {"pk": obj.pk}})


def add_transaction_view(request: HttpRequest, data: str) -> HttpResponse:
    """
    Creates records, some with rollbacks, and some with committed transactions
    """
    try:
        with transaction.atomic():
            add("!!abcd")
            raise Exception("foo")
    except Exception:
        pass

    with transaction.atomic():
        response = add_view(request, data)

    try:
        with transaction.atomic():
            add("!!defgh")
            raise Exception("foo")
    except Exception:
        pass

    return response


def list_view(request: HttpRequest) -> HttpResponse:
    """
    Returns a list of the PKs & data fields from the TestModel table
    """
    objects = TestModel.objects.order_by("id").all()
    data = [{"id": obj.id, "data": obj.data} for obj in objects]
    return JsonResponse({"data": data})


def sql_error_view(request: HttpRequest, data: str) -> HttpResponse:
    """
    Saves a new record, then triggers an SQL syntax error, then saves a record again
    """
    obj = add(data + "-1")
    try:
        with connection.cursor() as cursor:
            cursor.execute("this is bad sql")
    except DatabaseError:
        return JsonResponse({"data": {"state": "DB_Error_Caught", "pk": obj.pk}})

    return HttpResponse("Should have raised a DatabaseError", status=500)
