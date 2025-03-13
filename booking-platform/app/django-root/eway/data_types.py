from dataclasses import dataclass
import datetime
from typing import Optional
from typing import Union

import dateutil


@dataclass
class Transaction:
    # The authorisation code for this transaction as returned by the bank
    # Max length 6
    AuthorisationCode: str
    # The two digit response code returned from the bank
    # Max length 2
    ResponseCode: str
    # One or more Response Codes that describes the result of the action performed.  If a Beagle Alert is triggered, this may contain multiple codes: e.g. D4405, F7003
    # Max length 512
    ResponseMessage: str
    # An echo of the merchant's invoice number for this transaction
    # Max length 64
    InvoiceNumber: str
    # An echo of the merchant's reference number for this transaction
    # Max length 64
    InvoiceReference: str
    # The amount that was authorised for this transaction. If a card surcharge was charged, the TotalAmount will include the surcharge.
    # Max length 10
    TotalAmount: int
    # A unique identifier that represents the transaction in eWAY's system
    # Max length 8
    TransactionID: int
    # A bool value that indicates whether the transaction was successful or not
    # Max length
    TransactionStatus: bool
    # An eWAY-issued ID that represents the Token customer that was loaded or created for this transaction (if applicable)
    # Max length 16
    TokenCustomerID: int
    # v40+ (see versions) The maximum amount that could be refunded from this transaction
    # Max length 10
    # NOTE: This doesn't seem to account for refunded amount - it always returns the original amount even if
    # has been partially refunded already.
    MaxRefund: int
    # v40+ (see versions) Reserved for future use
    # Max length 1
    Source: int
    # v40+ (see versions) The ISO 4217 numeric currency code (e.g. AUD = 036)
    # Max length 3
    CurrencyCode: str
    # v40+ (see versions) A numeric representation of the transaction type: 1 - Purchase 4 - Refund 8 - PreAuth
    # Max length 1
    TransactionType: int
    # v40+ (see versions) True if funds were captured in the transaction.
    # Max length
    TransactionCaptured: bool
    # v40+ (see versions) The date and time the transaction took place
    # Max length 25
    # In practice will be a datetime always - post_init converts str to datetime
    TransactionDateTime: Union[str, datetime.datetime]
    # v40+ (see versions) Contains the original transaction ID if the queried transaction is a refund
    # Max length 8
    OriginalTransactionId: Optional[int] = None
    # Fraud score representing the estimated probability that the order is fraud, based off analysis of past Beagle Fraud Alerts transactions. This field will only be returned for transactions using the Beagle Free gateway.
    # Max length 6
    BeagleScore: Optional[str] = None
    # v40+ (see versions) The fraud action that occurred if any. One of NotChallenged, Allow, Review, PreAuth, Processed, Approved, Block
    # Max length 512
    FraudAction: Optional[str] = None

    def __post_init__(self):
        if type(self.TransactionDateTime) is str:
            self.TransactionDateTime = dateutil.parser.parse(self.TransactionDateTime)


@dataclass
class TokenPayment:
    # In cents
    TotalAmount: int
    CurrencyCode: str
    InvoiceNumber: str = ""
    InvoiceDescription: str = ""
    InvoiceReference: str = ""


@dataclass
class Verification:
    CVN: int
    Address: int
    Email: int
    Mobile: int
    Phone: int


@dataclass
class TokenCard:
    Name: str
    Number: str
    ExpiryMonth: str
    ExpiryYear: str
    # Will never be returned on existing records
    CVN: Optional[str] = None


@dataclass
class TokenCustomer:
    # The customer's title
    # Max length 5
    Title: str
    # The customer's first name.
    # Max length 50
    FirstName: str
    # The customer's last name
    # Max length 50
    LastName: str
    # The customer's country. A two letter ISO 3166-1 alpha-2 code as defined in the ISO 3166 standard. For more information see: http://www.iso.org/iso/country_names_and_code_elements
    # Max length 2
    Country: str
    CardDetails: TokenCard
    # An eWAY-issued ID that represents the Token customer to be loaded for this action.
    # Max length 16
    TokenCustomerID: int = None
    # The merchant's reference for this customer
    # Max length 50
    Reference: Optional[str] = None
    # The customer's company name.
    # Max length 50
    CompanyName: Optional[str] = None
    # The customer's job description / title.
    # Max length 50
    JobDescription: Optional[str] = None
    # The customer's street address.
    # Max length 50
    Street1: Optional[str] = None
    # The customer's street address.
    # Max length 50
    Street2: Optional[str] = None
    # The customer's city / town / suburb.
    # Max length 50
    City: Optional[str] = None
    # The customer's state / county.
    # Max length 50
    State: Optional[str] = None
    # The customer's post / zip code.
    # Max length 30
    PostalCode: Optional[str] = None
    # The customer's email address
    # Max length 50
    Email: Optional[str] = None
    # The customer's phone number.
    # Max length 32
    Phone: Optional[str] = None
    # The customer's mobile phone number.
    # Max length 32
    Mobile: Optional[str] = None
    # Any comments the merchant wishes to add about the customer.
    # Max length 255
    Comments: Optional[str] = None
    # The customer's fax number.
    # Max length 32
    Fax: Optional[str] = None
    # The customer's website.
    # Max length 512
    Url: Optional[str] = None


@dataclass
class TokenPaymentResponse:
    """Similar to Transaction but eway doesn't return it consistently

    Here Payment is nested eg. to get total amount it's Payment.TotalAmount
    but if you retrieve the charge separately it's a top level key
    """

    TransactionStatus: bool
    TransactionType: str
    Verification: Verification
    Customer: TokenCustomer
    Payment: TokenPayment
    AuthorisationCode: Optional[str] = None
    ResponseCode: Optional[str] = None
    ResponseMessage: Optional[str] = None
    TransactionID: Optional[int] = None
    BeagleScore: Optional[Union[str, int]] = None
    Errors: None = None


@dataclass
class RefundCard:
    ExpiryMonth: Optional[int] = None
    ExpiryYear: Optional[int] = None


@dataclass
class Refund:
    TransactionID: Optional[Union[str, int]]
    TotalAmount: int
    CurrencyCode: str
    InvoiceNumber: Optional[str] = None
    InvoiceReference: Optional[str] = None
    InvoiceDescription: Optional[str] = None


@dataclass
class RefundResponse:
    TransactionStatus: bool
    Refund: Refund
    Verification: Optional[Verification] = None
    AuthorisationCode: Optional[str] = None
    ResponseCode: Optional[str] = None
    ResponseMessage: Optional[str] = None
    TransactionID: Optional[int] = None
    Errors: None = None
