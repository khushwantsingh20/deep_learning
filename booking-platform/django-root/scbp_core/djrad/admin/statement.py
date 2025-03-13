from csv import writer
from datetime import date
from operator import itemgetter

from dateutil import parser
from django.contrib.postgres.fields.ranges import RangeStartsWith
from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
from django.utils.translation import gettext_lazy
from django_filters import DateFromToRangeFilter
from django_filters import filters
from psycopg2.extras import DateRange
from rest_framework import serializers
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from scbp_core.djrad.admin import RefineAccountChoiceFilter
from scbp_core.djrad.admin import ScbpAdminModelViewSet
from scbp_core.djrad.admin import ScbpAdminViewSetPermissions
from scbp_core.djrad.admin.base import ScbpAdminModelRegistration
from scbp_core.djrad.admin.base import ScbpAdminModelSerializer
from scbp_core.djrad.base import ScbpFilterSet
from scbp_core.djrad.sites import admin_site
from scbp_core.models import Account
from scbp_core.models import AccountPaymentTermsType
from scbp_core.models import AccountStatement
from scbp_core.models.account_field_choices import AccountPaymentMethodType
from scbp_core.services.generate_invoice_pdf import generate_statement_pdf
from scbp_core.services.send_statement_email import generate_statement_email
from scbp_core.tasks.create_statements import create_statements


class CreateStatementDateRangeField(serializers.DictField):
    """
    Custom
    Copied and massively simplified from https://github.com/Hipo/drf-extra-fields/blob/master/drf_extra_fields/fields.py
    """

    default_error_messages = {
        "not_a_dict": gettext_lazy(
            'Expected a dictionary of items but got type "{input_type}".'
        ),
        "too_much_content": gettext_lazy('Extra content not allowed - found "{extra}"'),
        "malformed_range": gettext_lazy(
            'Could not parse range - got "{value}" for {key}'
        ),
        "missing_range": gettext_lazy(
            "Both lower and upper values must be given - {missing_field} missing"
        ),
        "write_only": gettext_lazy("DateRangeField must be declared write_only"),
    }

    def to_internal_value(self, data):
        """
        Dict of primitive to range instance
        :param data:
        :return:
        """
        if not isinstance(data, dict):
            self.fail("not_a_dict", input_type=type(data).__name__)
        validated_dict = {}
        for key in ("lower", "upper"):
            try:
                value = data.pop(key)
            except KeyError:
                self.fail("missing_range", missing_field=key)
            try:
                validated_dict[key] = parser.parse(value, default=timezone.now()).date()
            except (ValueError, OverflowError):
                self.fail("malformed_range", key=key, value=value)
        if data:
            self.fail("too_much_content", extra=", ".join(map(str, data.keys())))
        return DateRange(**validated_dict)

    def to_representation(self, value):
        self.fail("write_only")


class CreateStatementsSerializer(serializers.Serializer):
    """
    This serializer takes a limited set of parameters and generates statements for
    all unallocated invoices matching the parameters - mass create operation falls
    outside the scope of StatementSerializer
    """

    payment_method = serializers.ChoiceField(
        AccountPaymentMethodType.choices, allow_blank=True, write_only=True
    )
    account = serializers.PrimaryKeyRelatedField(
        queryset=Account.all_objects.all(), write_only=True, allow_null=True
    )
    date_range = CreateStatementDateRangeField(write_only=True)
    custom_message = serializers.CharField(allow_blank=True)

    class Meta:
        fields = ("payment_method", "account", "date_range", "custom_message")

    def validate(self, data):
        # Validate that given account has given payment method
        account = data.get("account", None)
        payment_method = data.get("payment_method", None)
        if account and payment_method and account.payment_method != payment_method:
            raise serializers.ValidationError("Wrong payment method for account")
        return data

    def save(self, **kwargs):
        # Deconstruct validated_data
        account = self.validated_data.get("account", None)
        payment_method = self.validated_data.get("payment_method", None)
        custom_message = self.validated_data.get("custom_message", "")
        # Skipping the default values because we're guaranteed to have
        # valid values for this field if we get to this point
        date_range = self.validated_data.get("date_range")

        # Call the statement creator method
        create_statements.delay(
            account_id=account.pk if account else None,
            payment_method=payment_method,
            raw_lower=date_range.lower,
            raw_upper=date_range.upper,
            custom_message=custom_message,
        )


"""
Statement handling
"""


class StatementSerializer(ScbpAdminModelSerializer):
    """
    Serializer used to send statement information to the frontend - not intended to be used
    for the creation of statments (use CreateStatementsSerializer for that)
    """

    account_label = serializers.SerializerMethodField()
    period_start_date = serializers.SerializerMethodField()
    total_charge = serializers.SerializerMethodField()

    class Meta:
        model = AccountStatement
        fields = (
            "statement_number",
            "issued_on",
            "period_start_date",
            "account_label",
            "account_id",
            "total_charge",
            "payment_method",
        )
        extra_kwargs = {"issued_on": {"label": "Statement Date"}}

    def get_account_label(self, statement):
        return str(statement.account)

    def get_period_start_date(self, statement):
        return statement.period.lower

    def get_total_charge(self, statement):
        return statement.invoices.aggregate(Sum("invoice_total_amount"))[
            "invoice_total_amount__sum"
        ]


class StatementFilterSet(ScbpFilterSet):
    statement_number = filters.CharFilter(method="filter_statement_number")
    account = RefineAccountChoiceFilter()
    statement_date_range = DateFromToRangeFilter(field_name="period_start")

    class Meta:
        model = AccountStatement
        fields = ("statement_number", "account", "statement_date_range")

    def filter_statement_number(self, queryset, name, value):
        return queryset.filter(statement_number__icontains=value)


class StatementViewSetPermissions(ScbpAdminViewSetPermissions):
    actions_to_perms_map = {
        "create_statements": ["%(app_label)s.add_%(model_name)s"],
        "download": ["%(app_label)s.detail_%(model_name)s"],
        "reckon_download": ["%(app_label)s.list_%(model_name)s"],
        "resend_statement_email": ["%(app_label)s.detail_%(model_name)s"],
        "associated_email_addresses": ["%(app_label)s.detail_%(model_name)s"],
    }


class StatementViewSet(ScbpAdminModelViewSet):
    serializer_class = StatementSerializer
    queryset = (
        AccountStatement.objects.all()
        .select_related("account")
        .annotate(period_start=RangeStartsWith("period"))
    )
    filterset_class = StatementFilterSet
    permission_classes = (StatementViewSetPermissions,)

    @action(detail=False, methods=["POST"], url_path="create")
    def create_statements(self, request, *args, **kwargs):
        serializer = CreateStatementsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response()

    @action(methods=["GET"], detail=True, url_path="download")
    def download(self, request, pk):
        statement = self.get_object()
        default_filename = f"limomate_statement_{statement.statement_number}.PDF"
        response = HttpResponse(
            generate_statement_pdf(statement), content_type="application/pdf"
        )
        response["Content-Disposition"] = f'attachment; filename="{default_filename}"'
        return response

    @action(methods=["POST"], detail=True, url_path="resend-email")
    def resend_statement_email(self, request, pk):
        statement = self.get_object()
        email = request.data.get("email")
        generate_statement_email(statement, email).send()
        return Response(status=status.HTTP_200_OK)

    @action(methods=["GET"], detail=True, url_path="associated-email-addresses")
    def associated_email_addresses(self, request, pk):
        """Get email addresses associated with statement

        This is used to allow email address to be selected when sending a statement email.

        Lists main account email & any other client users associated with the account.
        """
        statement = self.get_object()
        account = statement.account
        account_members = []
        for atoc in account.account_to_client.all():
            account_members.append(
                (atoc.client_user.get_full_name(), atoc.client_user.email)
            )
        emails = [
            (
                f"Account Contact for {account.account_nickname}",
                [
                    (
                        " ".join(
                            [account.contact_first_name, account.contact_last_name]
                        ),
                        account.account_email,
                    )
                ],
            ),
            ("Other Account Members", account_members),
        ]
        return Response(emails, status=status.HTTP_200_OK)

    @action(methods=["GET"], detail=False, url_path="reckon-download")
    def reckon_download(self, request):
        month, year = itemgetter("month", "year")(request.query_params)
        year = int(year)
        month = int(month) + 1
        period_name = date(year, month, 1).strftime("%b_%Y")
        default_filename = f"limomate_reckon_{period_name}.txt"
        response = HttpResponse(content_type="text/tab-separated-values")
        csv_writer = writer(response, delimiter="\t")

        csv_writer.writerow(["Name", "Ref Number", "Item", "Rate", "Date"])
        for statement in (
            AccountStatement.objects.select_related("account")
            .prefetch_related("invoices")
            .filter(
                issued_on__year=year,
                issued_on__month=month,
                account__payment_terms=AccountPaymentTermsType.THIRTY_DAYS,
                account__payment_method=AccountPaymentMethodType.INVOICE,
            )
        ):
            csv_writer.writerow(
                [
                    statement.account.account_nickname,
                    statement.statement_number,
                    "Bookings",
                    str(
                        statement.invoices.aggregate(Sum("invoice_total_amount"))[
                            "invoice_total_amount__sum"
                        ]
                    ),
                    statement.issued_on.strftime("%d/%m/%Y"),
                ]
            )
        response["Content-Disposition"] = f'attachment; filename="{default_filename}"'
        return response


class StatementRegistration(ScbpAdminModelRegistration):
    viewset_class = StatementViewSet

    action_permissions = {
        **ScbpAdminModelRegistration.action_permissions,
        "download": ["%(app_label)s.detail_%(model_name)s"],
        "reckon_download": ["%(app_label)s.list_%(model_name)s"],
    }

    def get_global_actions(self):
        return super().get_global_actions() + ["reckon_download"]

    def get_object_actions(self):
        return super().get_object_actions() + ["download"]


admin_site.register(AccountStatement, StatementRegistration)
