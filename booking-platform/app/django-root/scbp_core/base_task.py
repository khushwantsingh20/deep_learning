from celery import Task
from django.db import transaction


class TransactionAwareTask(Task):
    """
    Task class which is aware of django db transactions and only executes tasks
    after transaction has been committed

    See: https://medium.com/hypertrack/dealing-with-database-transactions-in-django-celery-eac351d52f5f
    """

    abstract = True

    def apply_async(self, *args, **kwargs):
        """
        Unlike the default task in celery, this task does not return an async
        result
        """
        transaction.on_commit(
            lambda: super(TransactionAwareTask, self).apply_async(*args, **kwargs)
        )
