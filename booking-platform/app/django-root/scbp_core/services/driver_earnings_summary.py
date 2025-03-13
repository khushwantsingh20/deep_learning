from datetime import date
import json

from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.db import models
from django.db.models import functions
from django.db.models.fields.json import KeyTextTransform
from django.db.models.fields.json import KeyTransform
from django.db.models.functions import Cast
from django.db.models.functions import Coalesce
from google.oauth2 import service_account
import googleapiclient.discovery

from scbp_core.models import BookingPaymentMethod
from scbp_core.models import DriverUser
from scbp_core.models import VehicleOperator
from scbp_core.models import VehicleOperatorClassificationType


def make_parking_field_annotation(breakdown_field_name: str):
    """Helper to extract the airport parking from a JSON field"""
    return Cast(
        Coalesce(
            # Have to cast to Char first otherwise its jsonb and can't cast to Decimal / Coalesce doesn't work
            Cast(
                KeyTextTransform(
                    "airport_parking",
                    KeyTransform(
                        "fees",
                        breakdown_field_name,
                    ),
                ),
                models.CharField(),
            ),
            models.Value("0"),
        ),
        models.DecimalField(max_digits=8, decimal_places=2),
    )


# https://stackoverflow.com/questions/23861680/convert-spreadsheet-number-to-column-letter
def colnum_string(n):
    string = ""
    while n > 0:
        n, remainder = divmod(n - 1, 26)
        string = chr(65 + remainder) + string
    return string


class ColumnLookup:
    def __init__(self, headers):
        self.mapping = {
            name.lower(): colnum_string(i + 1) for i, name in enumerate(headers)
        }

    def __getitem__(self, item):
        """
        C["Invoice Group"] => "A"
        C["Invoice Group", 1] => "A1"
        """
        col = item
        if isinstance(item, tuple):
            col = item[0]
        if col.lower() not in self.mapping:
            raise ValueError(
                f"{col} not found in columns. Maybe it has been renamed in the spreadsheet?"
            )
        c = self.mapping[col.lower()]
        if isinstance(item, tuple):
            return f"{c}{item[1]}"
        return c


class RoundDecimal(models.Func):
    """
    Database function that rounds a value to two decimal places
    """

    function = "ROUND"
    template = "%(function)s(%(expressions)s, 2)"


def sum_or_zero(expression, **kwargs):
    return RoundDecimal(
        functions.Coalesce(models.Sum(expression, **kwargs), models.Value(0)), **kwargs
    )


def google_sheets_rgi_summary(*, month, year):
    display_period = date(year, month, 1).strftime("%b %Y")
    pay_date = (date(year, month, 15) + relativedelta(months=1)).strftime("%d %b %Y")
    fields = [
        "invoice_group",
        "vehicle_operator",
        "car_registration",
        "invoicing_party",
        "invoicing_party_number",
        "status",
        "abn",  # Exists on both models
        "period",
        "pay_date",
        "account_name",
        "bsb",
        "account_number",
        "email",  # Exists on Driver (called contact_email on VehicleOperator)
        "depot_fee",
        "driver_number",
        "driver_name",
        "earnings",
        "bonuses",
        "service_fee_percent",
        "service_fee",
        "marketing_fee_percent",
        "marketing_fee",
        "booking_count",
        "booking_fee",
        "airport_parking",
        "oop_amount",
        "gratuity_amount",
        "driver_collect",
    ]

    driver_invoice_filter = models.Q(
        bookings__driver_id=models.F("id"),
        bookings__invoices__issued_on__year=year,
        bookings__invoices__issued_on__month=month,
    )

    airport_parking_limomate = make_parking_field_annotation(
        "bookings__invoices__booking_price_breakdown"
    )

    limomate_invoice_lines = list(
        DriverUser.objects.filter(
            current_vehicle__vehicle_operator__classification=VehicleOperatorClassificationType.COMPANY
        )
        .annotate(
            invoice_group=functions.Concat(
                models.Value("D"), Cast(models.F("driver_no"), models.CharField())
            ),
            vehicle_operator=models.Value("SC", output_field=models.CharField()),
            car_registration=models.Value("", output_field=models.CharField()),
            invoicing_party=functions.Concat(
                models.F("first_name"), models.Value(" "), models.F("last_name")
            ),
            invoicing_party_number=models.F("driver_no"),
            status=models.Value("SC", output_field=models.CharField()),
            period=models.Value(display_period, output_field=models.CharField()),
            pay_date=models.Value(pay_date, output_field=models.CharField()),
            account_name=models.Value("", output_field=models.CharField()),
            bsb=models.Value("", output_field=models.CharField()),
            account_number=models.Value("", output_field=models.CharField()),
            depot_fee=models.Value(0, output_field=models.DecimalField()),
            driver_number=models.F("driver_no"),
            driver_name=functions.Concat(
                models.F("first_name"), models.Value(" "), models.F("last_name")
            ),
            booking_fee=sum_or_zero(
                models.F("bookings__invoices__fee_amount")
                + models.F("bookings__invoices__company_fee_amount"),
                filter=driver_invoice_filter,
                output_field=models.DecimalField(),
            ),
            airport_parking=sum_or_zero(
                airport_parking_limomate, output_field=models.DecimalField()
            ),
            earnings=sum_or_zero(
                models.F("bookings__invoices__invoice_total_amount")
                - models.F("bookings__invoices__company_fee_amount")
                - models.F("bookings__invoices__fee_amount")
                - airport_parking_limomate,
                filter=driver_invoice_filter,
                output_field=models.DecimalField(),
            ),
            bonuses=models.Value(0, output_field=models.DecimalField()),
            service_fee_percent=models.Value(50, output_field=models.DecimalField()),
            service_fee=RoundDecimal(
                models.F("earnings")
                * models.F("service_fee_percent")
                / models.Value(100),
                output_field=models.DecimalField(),
            ),
            marketing_fee_percent=models.Value(2, output_field=models.DecimalField()),
            marketing_fee=RoundDecimal(
                models.F("earnings")
                * models.F("marketing_fee_percent")
                / models.Value(100),
                output_field=models.DecimalField(),
            ),
            booking_count=models.Count("bookings__id", filter=driver_invoice_filter),
            oop_amount=sum_or_zero(
                "bookings__invoices__out_of_pocket_amount",
                filter=driver_invoice_filter,
                output_field=models.DecimalField(),
            ),
            gratuity_amount=models.Value(0, output_field=models.DecimalField()),
            driver_collect=sum_or_zero(
                "bookings__invoices__invoice_total_amount",
                filter=(
                    driver_invoice_filter
                    & models.Q(
                        bookings__booking_payment_method=BookingPaymentMethod.DRIVER_COLLECT
                    )
                ),
                output_field=models.DecimalField(),
            ),
        )
        .order_by("driver_no")
        .values(*fields)
    )

    operator_invoice_filter = models.Q(
        vehicles__bookings__driver_id=models.F("vehicles__drivers__id"),
        vehicles__bookings__invoices__issued_on__year=year,
        vehicles__bookings__invoices__issued_on__month=month,
    )

    airport_parking_external = make_parking_field_annotation(
        "vehicles__bookings__invoices__booking_price_breakdown"
    )

    external_invoice_lines = list(
        VehicleOperator.objects.exclude(
            classification=VehicleOperatorClassificationType.COMPANY
        )
        .annotate(
            invoice_group=functions.Concat(
                models.Value("V"),
                models.F("vehicle_operator_no"),
                models.Value("-"),
                models.F("vehicles__car_no"),
            ),
            vehicle_operator=models.F("vehicle_operator_no"),
            car_registration=models.F("vehicles__car_no"),
            invoicing_party=models.F("company_name"),
            invoicing_party_number=models.F("vehicle_operator_no"),
            status=models.Case(
                *[
                    models.When(
                        classification=classification_type,
                        then=models.Value(
                            VehicleOperatorClassificationType.choices[
                                classification_type
                            ],
                            output_field=models.CharField(),
                        ),
                    )
                    for classification_type in VehicleOperatorClassificationType.choices
                ],
                default=models.Value("Other", output_field=models.CharField()),
            ),
            period=models.Value(display_period, output_field=models.CharField()),
            pay_date=models.Value(pay_date, output_field=models.CharField()),
            account_name=models.F("bank_account_name"),
            bsb=models.F("bank_bsb"),
            account_number=models.F("bank_account_number"),
            email=models.F("contact_email"),
            depot_fee=models.F("monthly_depot_fee"),
            driver_number=models.F("vehicles__drivers__driver_no"),
            driver_name=functions.Concat(
                models.F("vehicles__drivers__first_name"),
                models.Value(" "),
                models.F("vehicles__drivers__last_name"),
            ),
            booking_fee=sum_or_zero(
                models.F("vehicles__bookings__invoices__fee_amount")
                + models.F("vehicles__bookings__invoices__company_fee_amount"),
                filter=operator_invoice_filter,
                output_field=models.DecimalField(),
            ),
            airport_parking=sum_or_zero(
                airport_parking_external, output_field=models.DecimalField()
            ),
            earnings=sum_or_zero(
                models.F("vehicles__bookings__invoices__invoice_total_amount")
                - models.F("vehicles__bookings__invoices__fee_amount")
                - models.F("vehicles__bookings__invoices__company_fee_amount")
                - airport_parking_external,
                filter=operator_invoice_filter,
                output_field=models.DecimalField(),
            ),
            bonuses=models.Value(0, output_field=models.DecimalField()),
            service_fee=RoundDecimal(
                models.F("earnings")
                * models.F("service_fee_percent")
                / models.Value(100),
                output_field=models.DecimalField(),
            ),
            marketing_fee_percent=models.F("marketing_levy"),
            marketing_fee=RoundDecimal(
                models.F("earnings")
                * models.F("marketing_fee_percent")
                / models.Value(100),
                output_field=models.DecimalField(),
            ),
            booking_count=models.Count(
                "vehicles__bookings__id",
                filter=operator_invoice_filter,
                output_field=models.IntegerField(),
            ),
            oop_amount=sum_or_zero(
                "vehicles__bookings__invoices__out_of_pocket_amount",
                filter=operator_invoice_filter,
                output_field=models.DecimalField(),
            ),
            gratuity_amount=models.Value(0, output_field=models.DecimalField()),
            driver_collect=sum_or_zero(
                "vehicles__bookings__invoices__invoice_total_amount",
                filter=(
                    operator_invoice_filter
                    & models.Q(
                        vehicles__bookings__booking_payment_method=BookingPaymentMethod.DRIVER_COLLECT
                    )
                ),
                output_field=models.DecimalField(),
            ),
        )
        .order_by(
            "classification",
            "vehicle_operator_no",
            "vehicles__car_no",
            "vehicles__drivers__driver_no",
        )
        .values(*fields)
    )

    all_lines = limomate_invoice_lines + external_invoice_lines

    depot_fee_charged = set()
    for line in all_lines:
        if line["invoice_group"] in depot_fee_charged:
            line["depot_fee"] = 0
        else:
            depot_fee_charged.add(line["invoice_group"])

    # Write to google sheets
    scopes = ["https://www.googleapis.com/auth/spreadsheets"]
    google_sheet_id = settings.GOOGLE_SHEETS_RGI_ID
    credentials = service_account.Credentials.from_service_account_info(
        json.loads(settings.GOOGLE_SHEETS_CREDENTIALS), scopes=scopes
    )

    service = googleapiclient.discovery.build("sheets", "v4", credentials=credentials)
    sheet = service.spreadsheets()
    sheet_name = "Driver Earnings Summary"

    # Clear existing data
    existing_row_count = len(
        sheet.values()
        .get(spreadsheetId=google_sheet_id, range=f"{sheet_name}!A2:A")
        .execute()
        .get("values", [])
    )
    if existing_row_count > 0:
        sheet.values().clear(
            spreadsheetId=google_sheet_id,
            range=f"{sheet_name}!A2:AS{existing_row_count + 1}",
        ).execute()
    headers = [
        h.lower().strip()
        for h in sheet.values()
        .get(spreadsheetId=google_sheet_id, range=f"{sheet_name}!1:1")
        .execute()["values"][0]
    ]
    if len(headers) != len(set(headers)):
        dupes = {h for h in headers if headers.count(h) > 1}
        raise ValueError(f"Headers must be unique, dupes: {', '.join(dupes)}")
    C = ColumnLookup(headers)

    # Data conversion from query result to writable array
    operator_info_data = [
        [
            item["invoice_group"],
            item["vehicle_operator"],
            item["car_registration"],
            item["invoicing_party"],
            item["invoicing_party_number"],
            item["status"],
            item["abn"],
            item["period"],
            item["driver_name"],
            item["pay_date"],
            item["account_name"],
            item["bsb"],
            item["account_number"],
            item["email"],
            float(item["depot_fee"]),
        ]
        for item in all_lines
    ]
    driver_earnings_data = [
        [
            item["driver_number"],
            item["driver_name"],
            float(item["earnings"]),
            float(item["bonuses"]),
        ]
        for item in all_lines
    ]
    driver_fee_data = [
        [
            float(item["service_fee"]),
            float(item["service_fee_percent"]),
            float(item["marketing_fee"]),
            float(item["marketing_fee_percent"]),
            float(item["booking_fee"]),
            item["booking_count"],
        ]
        for item in all_lines
    ]

    def column_selector(column):
        return f"{column}2:{column}{len(all_lines) + 1}"

    def same_driver_spreadsheet_conditions(row):
        return f"{column_selector('C')}, INDEX(C{row}), {column_selector('B')}, INDEX(B{row})"

    # Write new data to spreadsheet
    write_body = {
        "valueInputOption": "USER_ENTERED",
        "data": [
            {
                "range": f"{sheet_name}!{C['Invoice Group', 2]}",
                "values": operator_info_data,
            },
            {
                "range": f"{sheet_name}!{C['Total VO Fees', 2]}",
                "values": [
                    [
                        f"=sum({C['Depot Fee', row + 2]}:{C['Franchise Fee', row+2]})"
                        for row in range(len(all_lines))
                    ]
                ],
                "majorDimension": "COLUMNS",
            },
            {
                "range": f"{sheet_name}!{C['Total Costs', 2]}",
                "values": [
                    [
                        f"=sum({C['Fuel', row + 2]}:{C['Other', row + 2]})"
                        for row in range(len(all_lines))
                    ]
                ],
                "majorDimension": "COLUMNS",
            },
            {"range": f"{sheet_name}!{C['Driver', 2]}", "values": driver_earnings_data},
            {
                "range": f"{sheet_name}!{C['Total Earnings', 2]}",
                "values": [
                    # Earnings + Bonuses + Booking Fee
                    [
                        f"={C['Earnings', row + 2]}+{C['Bonuses', row + 2]}+{C['Booking Fee', row+2]}"
                        for row in range(len(all_lines))
                    ]
                ],
                "majorDimension": "COLUMNS",
            },
            {"range": f"{sheet_name}!{C['Service Fee', 2]}", "values": driver_fee_data},
            {
                "range": f"{sheet_name}!{C['Total Driver Fees', 2]}",
                "values": [
                    [
                        # Service Fee + Marketing Fee
                        # Should not include Booking Fee
                        f"=sum({C['Service Fee', row + 2]}, {C['Marketing Fee', row + 2]})"
                        for row in range(len(all_lines))
                    ]
                ],
                "majorDimension": "COLUMNS",
            },
            {
                "range": f"{sheet_name}!{C['Parking', 2]}",
                "values": [[float(item["airport_parking"]) for item in all_lines]],
                "majorDimension": "COLUMNS",
            },
            {
                "range": f"{sheet_name}!{C['OOP', 2]}",
                "values": [[float(item["oop_amount"]) for item in all_lines]],
                "majorDimension": "COLUMNS",
            },
            {
                "range": f"{sheet_name}!{C['Other Additions', 2]}",
                "values": [[float(item["gratuity_amount"]) for item in all_lines]],
                "majorDimension": "COLUMNS",
            },
            {
                "range": f"{sheet_name}!{C['Total Additions', 2]}",
                "values": [
                    [
                        f"=sum({C['Parking', row + 2]}:{C['Other Additions', row + 2]})"
                        for row in range(len(all_lines))
                    ]
                ],
                "majorDimension": "COLUMNS",
            },
            {
                "range": f"{sheet_name}!{C['Driver Collect', 2]}",
                "values": [[float(item["driver_collect"]) for item in all_lines]],
                "majorDimension": "COLUMNS",
            },
            {
                "range": f"{sheet_name}!{C['Total Deductions', 2]}",
                "values": [
                    [
                        f"=sum({C['Driver Collect', row + 2]}:{C['Advance Payment', row + 2]})"
                        for row in range(len(all_lines))
                    ]
                ],
                "majorDimension": "COLUMNS",
            },
            {
                "range": f"{sheet_name}!{C['Driver Total per Driver', 2]}",
                "values": [
                    [
                        f"={C['Total Earnings', row + 2]}-{C['Total Driver Fees', row + 2]}+{C['Total Additions', row + 2]}-{C['Total Deductions', row + 2]}",
                        f"=SUMIFS({column_selector(C['Driver Total per Driver'])}, {same_driver_spreadsheet_conditions(row + 2)})",
                        f"=SUMIFS({column_selector(C['Total VO Fees'])}, {same_driver_spreadsheet_conditions(row + 2)}) + "
                        f"SUMIFS({column_selector(C['Total Costs'])}, {same_driver_spreadsheet_conditions(row + 2)})",
                        f"={C['Driver Total Per Car', row + 2]}-{C['VO Total Deductions', row+2]}",
                    ]
                    for row in range(len(all_lines))
                ],
            },
        ],
    }
    sheet.values().batchUpdate(spreadsheetId=google_sheet_id, body=write_body).execute()
    return f"https://docs.google.com/spreadsheets/d/{google_sheet_id}/"
