from typing import Optional

from .models import TestModel

_counter = 0


def add(data: Optional[str] = None) -> TestModel:
    global _counter
    if data is None:
        data = f"auto{_counter}"
        _counter += 1
    obj = TestModel.objects.create(data=data)
    obj.save()
    return obj
