import dataclasses
from typing import Optional
from typing import Union

from dacite import from_dict

from eway.api_requestor import ApiRequestor
import eway.data_types as data_types
from eway.error import EwayApiError
from eway.error import handle_error
from eway.error import raise_errors_on_failure


def truncate_str(s: str, length: int) -> str:
    if len(s) > length:
        return s[: length - 3] + "..."
    return s


class TokenPayment:
    @classmethod
    def retrieve(cls, token_id: int) -> data_types.TokenCustomer:
        """Retrieve a token by it's id

        Raises TokenCustomerNotFoundError if no customer found by specified token. Raises EwayApiError for all other errors.
        """
        try:
            response = ApiRequestor().call("get", f"Customer/{token_id}")
            return from_dict(data_types.TokenCustomer, response.data["Customers"][0])
        except EwayApiError as e:
            handle_error(e)

    @classmethod
    def create(
        cls, customer: data_types.TokenCustomer
    ) -> data_types.TokenPaymentResponse:
        return from_dict(
            data_types.TokenPaymentResponse,
            ApiRequestor()
            .call(
                "post",
                "Transaction",
                {
                    "Customer": (
                        customer
                        if isinstance(customer, dict)
                        else dataclasses.asdict(customer)
                    ),
                    "Payment": {"TotalAmount": 0},
                    "Method": "CreateTokenCustomer",
                    "TransactionType": "Purchase",
                    "SaveCustomer": True,
                },
            )
            .data,
        )

    @classmethod
    def update(
        cls, customer: data_types.TokenCustomer
    ) -> data_types.TokenPaymentResponse:
        customer = (
            customer if isinstance(customer, dict) else dataclasses.asdict(customer)
        )
        if not customer.get("TokenCustomerID"):
            raise ValueError("You must specify TokenCustomerID for updates")
        return from_dict(
            data_types.TokenPaymentResponse,
            ApiRequestor()
            .call(
                "post",
                "Transaction",
                {
                    "Customer": customer,
                    "Payment": {"TotalAmount": 0},
                    "Method": "UpdateTokenCustomer",
                    "TransactionType": "Purchase",
                    "SaveCustomer": True,
                },
            )
            .data,
        )

    @classmethod
    def charge(
        cls,
        customer_id: Union[data_types.TokenCustomer, int],
        amount_cents: int,
        invoice_ref: Optional[str] = None,
        invoice_description: Optional[str] = None,
    ) -> data_types.TokenPaymentResponse:
        """Create a charge against an existing token
        Raises TokenCustomerNotFound if no customer found by specified token.
        Raises EwayFailedOperationError if the charge attempt returns an error status code
        Raises EwayApiError for all other errors.
        """
        if not isinstance(customer_id, int):
            customer_id = customer_id.TokenCustomerID
        payment_data = {"TotalAmount": amount_cents}
        if invoice_ref:
            payment_data["InvoiceReference"] = truncate_str(invoice_ref, 50)
        if invoice_description:
            payment_data["InvoiceDescription"] = truncate_str(invoice_description, 64)
        try:
            data = from_dict(
                data_types.TokenPaymentResponse,
                ApiRequestor()
                .call(
                    "post",
                    "Transaction",
                    {
                        "Customer": {"TokenCustomerId": customer_id},
                        "Payment": payment_data,
                        "Method": "ProcessPayment",
                        "TransactionType": "Recurring",
                    },
                )
                .data,
            )
            raise_errors_on_failure(data)
            return data
        except EwayApiError as e:
            handle_error(e)
