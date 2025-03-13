from random import randint

from django.conf import settings
from django.http import HttpResponseRedirect
from django.urls import get_script_prefix
from django.views.generic import TemplateView

from scbp_core.djrad.sites import ScbpBaseSite
from scbp_core.models import AccountCategoryType
from scbp_core.models import AccountDriverCollectMethod
from scbp_core.models import AccountInvoicingMethodType
from scbp_core.models import AccountPaymentMethodType
from scbp_core.models import AccountPaymentTermsType
from scbp_core.models import AirportTerminal
from scbp_core.models import BookingAddressType
from scbp_core.models import BookingDriverCollectMethod
from scbp_core.models import BookingMethod
from scbp_core.models import BookingPaymentMethod
from scbp_core.models import BookingStatus
from scbp_core.models import BookingType
from scbp_core.models import ClientAddressType
from scbp_core.models import DriverUser
from scbp_core.models import MAX_BOOKING_DURATION_HOURS
from scbp_core.models import MIN_BOOKING_DURATION_HOURS
from scbp_core.models import PaymentStatus
from scbp_core.models import PriceVariationType
from scbp_core.models import RateScheduleType
from scbp_core.models.user import ClientUserPriority
from scbp_core.models.user_type import UserType


def create_choice_constants(*choices_list):
    """Create representation of choices for use on frontend

    Takes something like

        class ABC:
            A = 1
            B = 2
            C = 3

            choices = ((A, "One"), (B, "Two"), (C, "Three"))

    and returns

        {
            "ABC": [
                {"value": 1, "label": "One", "name": "A"},
                {"value": 2, "label": "Two", "name": "B"},
                {"value": 3, "label": "Three", "name": "C"},
            ]
        }

    The frontend can then offer a class called ABC with usage like
    ABC.A.value, ABC.A.label
    """
    consts = {}
    for choices_class in choices_list:
        try:
            value_by_name = {
                getattr(choices_class, attr): attr
                for attr in dir(choices_class)
                if attr.isupper()
            }
            consts[choices_class.__name__] = []

            choices = choices_class.choices
            if isinstance(choices, dict):  # dict or ordered dict
                choices = choices.items()
            for value, label in choices:
                if value not in value_by_name:
                    raise ValueError(
                        f"Expected to find constant with value {value} in {choices_class.__name__} but did not (got {value_by_name})"
                    )
                consts[choices_class.__name__].append(
                    dict(value=value, label=label, name=value_by_name[value])
                )

        except AttributeError:
            raise ValueError(
                "Only classes that define a `choices` attribute can be passed to create_choice_constants"
            )
    return consts


class FrontendView(TemplateView):
    template_name = "frontend.html"

    entry_point: str = None
    basename: str = ""
    site: ScbpBaseSite = None

    def get(self, request, *args, **kwargs):
        if request.user and not request.user.is_anonymous:
            required_user_types = self.site.get_supported_user_types()
            if isinstance(request.user, DriverUser):
                raise NotImplementedError(
                    "Support for DriverUser logging in has not yet been implemented"
                )
            # We intentionally only check class directly, not isinstance as everything descends from User
            # and we want to be able to check for a User with no profile
            if request.user.__class__ not in required_user_types:
                url = self.site.get_unsupported_user_type_redirect(request.user)
                return HttpResponseRedirect(url)
        context = self.get_context_data(request=request, **kwargs)
        return self.render_to_response(context)

    def get_initial_state(self, request):
        return self.site.get_initial_state(request)

    def get_settings(self):
        """These settings are made available in the frontend using useSettings

        Example:

            const { googleApiKey } = useSettings();
        """
        return {
            "scContactInfo": {"officeNumber": "1300 12 LIMO"},
            "googleApiKey": settings.GOOGLE_API_FRONTEND_KEY,
            "ewayEncryptionKey": settings.EWAY_CLIENT_SIDE_ENCRYPTION_KEY,
            "generatedEmailTemplate": settings.LEGACY_CLIENT_EMAIL_ADDRESS_TEMPLATE,
            "bookingLimits": {
                "maxDurationHours": MAX_BOOKING_DURATION_HOURS,
                "minDurationHours": MIN_BOOKING_DURATION_HOURS,
            },
            **self.site.get_frontend_settings(),
        }

    def get_app_context(self, request):
        initial_model_data = []
        if request.user and not request.user.is_anonymous:
            initial_model_data.append(
                self.site.user_serializer_class(
                    request.user, context={"request": request}
                )
            )
            initial_model_data += self.site.get_initial_model_data(request)

        smoke = randint(1, 9)
        mirror = randint(1, 9)
        request.session["makeshift captcha"] = smoke + mirror
        # display numbers in FullWidth: １２...
        smoke = f"0xff1{smoke}"
        mirror = f"0xff1{mirror}"

        return {
            "settings": self.get_settings(),
            "basename": self.basename,
            "baseUrl": "{}://{}{}".format(
                request.scheme, request.get_host(), get_script_prefix()
            ),
            # If you add more types here update choiceConstants.js on frontend to have corresponding
            # type on the frontend
            "choiceConstants": create_choice_constants(
                AirportTerminal,
                BookingType,
                BookingStatus,
                BookingAddressType,
                ClientAddressType,
                UserType,
                AccountPaymentMethodType,
                AccountDriverCollectMethod,
                AccountPaymentTermsType,
                AccountCategoryType,
                RateScheduleType,
                AccountInvoicingMethodType,
                PriceVariationType,
                BookingMethod,
                BookingPaymentMethod,
                BookingDriverCollectMethod,
                ClientUserPriority,
                PaymentStatus,
            ),
            # Used to populate redux initial state
            "initialState": self.get_initial_state(request),
            "djradContext": self.site.get_runtime_context(
                request, initial_model_data=initial_model_data
            ),
            "sentry": getattr(settings, "SENTRY_CONFIG_JS", None),
            "user": {
                "id": request.user and request.user.id,
                "email": request.user and getattr(request.user, "email", None),
            },
            "watchmen": {
                "a": smoke,
                "b": mirror,
            },  # makeshift captcha - we ask user to sum these two nums
            # Include other data you want made available to JS here
        }

    def get_context_data(self, request, **kwargs):
        context = super().get_context_data(**kwargs)

        if not self.entry_point:
            raise ValueError(
                'You must provide entry_point to FrontEndView, eg. FrontEndView.as_view(entry_point="app")'
            )

        context["entry_point"] = self.entry_point
        context["app_context"] = self.get_app_context(request)
        context["site"] = self.site
        context["site_static_filename"] = self.site.get_static_filename()
        context["DEBUG"] = settings.DEBUG
        context["DJRAD_ENABLED"] = "djrad" in settings.INSTALLED_APPS
        is_mobile_app = request.get_host() == "mobile.mylimomate.com.au"
        context["is_mobile_app"] = is_mobile_app

        return context


class FrontendContextView(FrontendView):
    """
    Used by styleguidist to get access to the context generated in FrontendView.

    It needs access to the global __APP_CONTEXT__ but doesn't load the site via FrontendView - it has
    it's own entry point. To make it available it loads this view via a script tag instead.
    """

    template_name = "frontend_context_only.html"

    site = None

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(request=request, **kwargs)
        return self.render_to_response(context)

    def get_context_data(self, request, **kwargs):
        context = kwargs
        if "view" not in kwargs:
            kwargs["view"] = self
        context["app_context"] = self.get_app_context(request)

        return context
