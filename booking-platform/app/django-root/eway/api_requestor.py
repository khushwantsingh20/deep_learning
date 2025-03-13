from typing import Dict
from typing import Optional

import requests
from requests.auth import HTTPBasicAuth

import eway
from eway.error import EwayApiError
from eway.error import EwayAuthenticationError
from eway.error import EwayError
from eway.response_codes import error_codes


class EwayResponse:
    http_status: int
    http_body: str
    data: Dict

    def __init__(self, http_body: str, http_status: int, data: Optional[Dict] = None):
        """

        :param http_body: Expected to be a valid json response if not empty
        :param http_status:
        """
        self.http_status = http_status
        self.http_body = http_body
        self.data = data if data is not None else {}

    def __repr__(self):
        return (
            f"EwayResponse(http_status={self.http_status}, http_body={self.http_body})"
        )


class ApiRequestor:
    _api_key: str
    _api_key_password: str

    def _make_auth(self):
        api_key = self._api_key or eway.api_key
        api_key_password = self._api_key_password or eway.api_key_password
        if api_key is None or api_key_password is None:
            raise EwayAuthenticationError(
                "No API key specified. You can set your API key using\n"
                "eway.api_key = <API_KEY>\n"
                "eway.api_key_password = <API_KEY_PASS>"
            )
        return HTTPBasicAuth(api_key, api_key_password)

    def __init__(
        self, api_key: str = None, api_key_password: str = None, api_url: str = None
    ):
        """
        :param api_key: If not specified uses eway.api_key
        :param api_key_password: If not specified uses eway.api_key_password
        :param api_url:  If not specified uses eway.api_url
        """
        self._api_key = api_key
        if api_key is not None and api_key_password is None:
            raise EwayError(
                "If api_key is specified api_key_password must also be specified"
            )
        self._api_key_password = api_key_password
        self._api_url = api_url

    def _is_success(self, response: EwayResponse) -> bool:
        """Determine if a response is a success

        Not obvious how you are supposed to do this. Documentation indicates there's a
        TransactionStatus to indicate success but it appears this only applies if payment
        is taken... creating a token will have a value  of False here.

        For now assuming on failure errors will be set otherwise won't be
        """
        return not bool(response.data.get("Errors"))

    def call(self, method: str, url_part: str, data: Dict = None) -> EwayResponse:
        """Call specified method and URL endpoint.

        Low level API - mainly for internal use. Use higher level API where possible
        (eg. TokenPayment)

        Uses eway.api_url as the base URL if not passed in to ApiRequestor
        """
        url = self._api_url or eway.api_url
        if not url[-1] == "/":
            url += "/"
        url += url_part
        valid_methods = ["get", "post"]
        if method not in valid_methods:
            raise EwayError(f"method must be one of {valid_methods}")
        fn = getattr(requests, method)
        # We specify a timeout to avoid cases where could be waiting indefinitely
        response = fn(
            url,
            auth=self._make_auth(),
            json=data,
            headers={"X-EWAY-APIVERSION": "40"},
            timeout=20,
        )
        http_status = response.status_code
        http_body = response.content
        try:
            if hasattr(http_body, "decode"):
                http_body = http_body.decode("utf-8")
            data = {}
            if http_body:
                data = response.json()
            eway_response = EwayResponse(http_body, http_status, data)
        except Exception:
            raise EwayApiError(
                f"Invalid API response body with status {http_status}: {http_body}",
                http_status=http_status,
                http_body=http_body,
            )
        if not 200 <= http_status < 300:
            self._handle_http_error_response(eway_response)
        if "Errors" not in eway_response.data:
            raise EwayApiError(
                f"Invalid response {http_status}: {http_body}",
                http_status=http_status,
                http_body=http_body,
            )
        if not self._is_success(eway_response):
            # Errors are returned as comma separated list
            response_error_codes = eway_response.data["Errors"]
            error_messages = [
                error_codes.get(code, "Unknown error")
                for code in response_error_codes.split(",")
            ]
            raise EwayApiError(
                ", ".join(error_messages),
                http_status=http_status,
                http_body=http_body,
                error_codes=response_error_codes.split(","),
            )

        return eway_response

    def _handle_http_error_response(self, eway_response: EwayResponse):
        if eway_response.http_status == 401:
            url = self._api_url or eway.api_url
            raise EwayAuthenticationError(
                f"Authentication failure. Check eway.api_key and eway.api_key_secret are set correctly for url {url}",
                http_body=eway_response.http_body,
                http_status=eway_response.http_status,
            )
        raise EwayApiError(
            http_body=eway_response.http_body, http_status=eway_response.http_status
        )
