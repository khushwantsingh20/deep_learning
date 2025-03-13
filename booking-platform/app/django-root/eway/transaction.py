from dacite import from_dict

from eway.api_requestor import ApiRequestor
import eway.data_types as data_types
from eway.data_types import RefundResponse
from eway.error import EwayApiError
from eway.error import handle_error
from eway.error import TransactionNotFoundError


class Transaction:
    @classmethod
    def retrieve(cls, transaction_id: int):
        """Retrieve a transaction by its id

        Raises TransactionNotFoundError if no transaction found by specified token. Raises EwayApiError for all other errors.
        """
        try:
            response = ApiRequestor().call("get", f"Transaction/{transaction_id}")
            if not response.data["Transactions"]:
                raise TransactionNotFoundError(
                    f"No transaction found for id {transaction_id}"
                )
            return from_dict(data_types.Transaction, response.data["Transactions"][0])
        except EwayApiError as e:
            handle_error(e)

    @classmethod
    def refund(cls, transaction_id: int, amount_cents: int) -> RefundResponse:
        """Refund some amount against a transaction

        Raises RefundAmountTooHighError if amount is greater than refundable amount. Raises EwayApiError for all other
        errors.
        """
        if amount_cents <= 0:
            # We do not support negative or zero refund amounts
            # (eWay interprets negative amounts as a request to refund the entire transaction)
            # (no idea what happens if we send zero, and not interested in finding out)
            raise ValueError("amount_cents must be greater than zero")
        try:
            return from_dict(
                RefundResponse,
                ApiRequestor()
                .call(
                    "post",
                    f"Transaction/{transaction_id}/Refund",
                    {"Refund": {"TotalAmount": amount_cents}},
                )
                .data,
            )
        except EwayApiError as e:
            handle_error(e)
