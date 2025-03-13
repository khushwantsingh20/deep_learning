import logging


def suppress_request_warnings(original_function):
    """
    If we need to test for 404s or 405s this decorator can prevent the
    request class from throwing warnings.

    It appears this are output regardless based on logging settings. Cannot be
    caught with warnings.catch_warnings()

    Usage:

        @suppress_request_warnings
        def test_vehicle_class_list_read_only(self):
            list_url = app_site.reverse_registration_url(vehicle_class_registration, "list")
            response = self.client.post(list_url, {}, format="json")
            # We don't want to be told about the 405 as a warning
            self.assertEqual(response.status_code, 405)

    Source: https://stackoverflow.com/questions/6377231/avoid-warnings-on-404-during-django-test-runs
    """

    def new_function(*args, **kwargs):
        # raise logging level to ERROR
        logger = logging.getLogger("django.request")
        previous_logging_level = logger.getEffectiveLevel()
        logger.setLevel(logging.ERROR)

        # trigger original function that would throw warning
        original_function(*args, **kwargs)

        # lower logging level back to previous
        logger.setLevel(previous_logging_level)

    return new_function
