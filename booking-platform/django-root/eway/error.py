from eway.response_codes import error_codes


class EwayError(Exception):
    def __init__(
        self, message=None, http_status=None, http_body=None, error_codes=None
    ):
        super().__init__(message)
        self._message = message
        self.http_status = http_status
        self.http_body = http_body
        self.error_codes = error_codes or []

    def __str__(self):
        message = self._message
        if not message:
            message = "<empty message>"
        if self.error_codes:
            codes = ", ".join(self.error_codes)
            return f"Codes: {codes} Message: {message}"
        return message

    def __repr__(self):
        return f"{self.__class__.__name__}(message={self._message}, http_status={self.http_status})"


class EwayAuthenticationError(EwayError):
    pass


class EwayApiError(EwayError):
    pass


class EwayFailedOperationError(EwayError):
    """
    Exception indicating failure status for charge operation
    """

    def __init__(self, error_states, http_status=None, http_body=None):
        super().__init__(
            message=",".join(error_states.values()),
            http_status=http_status,
            http_body=http_body,
            error_codes=list(error_states.keys()),
        )


class TransactionNotFoundError(EwayApiError):
    pass


class TokenCustomerNotFoundError(EwayApiError):
    pass


class RefundAmountTooHighError(EwayApiError):
    pass


def handle_error(e: EwayApiError):
    if "V6040" in e.error_codes:
        raise TokenCustomerNotFoundError(
            message=e._message,
            http_status=e.http_status,
            http_body=e.http_body,
            error_codes=e.error_codes,
        ) from e
    if "V6151" in e.error_codes:
        raise RefundAmountTooHighError(
            message=e._message,
            http_status=e.http_status,
            http_body=e.http_body,
            error_codes=e.error_codes,
        ) from e
    raise e


def raise_errors_on_failure(data):
    status_codes = set(data.ResponseMessage.split(","))
    charge_error_codes = status_codes & set(error_codes.keys())
    if charge_error_codes:
        charge_errors = {
            error_code: error_codes[error_code] for error_code in charge_error_codes
        }
        raise EwayFailedOperationError(error_states=charge_errors)
