from celery import shared_task
import createsend
from django.conf import settings
from django.core.paginator import Paginator
from django.utils import timezone

from scbp_core.models import ClientUser

api_key = settings.CAMPAIGN_MONITOR_API_KEY


def get_subscription_params_for_client(client: ClientUser):
    email_address = client.email
    name = client.get_full_name()
    last_booked = client.created_bookings.order_by("-created_at").first()
    if last_booked:
        last_booked = timezone.localdate(last_booked.created_at).isoformat()
    custom_params = [
        {
            "Key": "[DateAdded]",
            "Value": timezone.localtime(client.date_joined).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        },
        {"Key": "[ClientNo]", "Value": client.id},
        {"Key": "[LastBooked]", "Value": last_booked},
    ]
    return email_address, name, custom_params


@shared_task
def create_or_update_subscription(client_id):
    if not api_key:
        return "No API Key"
    try:
        client = ClientUser.objects.get(id=client_id)
    except ClientUser.DoesNotExist:
        return f"No client for id {client_id}"
    email_address, name, custom_params = get_subscription_params_for_client(client)
    api_client = createsend.Subscriber(
        auth={"api_key": api_key},
        list_id=settings.CAMPAIGN_MONITOR_LIST_ID,
        email_address=email_address,
    )
    try:
        # If email isn't already on the list it needs to be added
        api_client.get()
    except createsend.createsend.BadRequest:
        api_client.add(
            settings.CAMPAIGN_MONITOR_LIST_ID,
            email_address,
            name,
            custom_params,
            resubscribe=False,
            consent_to_track="Yes",
        )
    else:
        # Excluded from try block to ensure the add code is only called if the subscriber does not exist
        # (if this was within the try block, its failure would raise the same BadRequest
        # exception and trigger the add code - very much not what we want)
        api_client.update(
            email_address,
            name,
            custom_params,
            resubscribe=False,
            consent_to_track="Yes",
        )


def export_subscriptions(clients: [ClientUser]):
    if not api_key:
        return
    paginator = Paginator(clients, 999)
    api_client = createsend.Subscriber(
        auth={"api_key": api_key},
        list_id=settings.CAMPAIGN_MONITOR_LIST_ID,
    )
    for page_number in paginator.page_range:
        subscribers = []
        for client in paginator.page(page_number).object_list:
            email_address, name, custom_params = get_subscription_params_for_client(
                client
            )
            subscribers.append(
                {
                    "EmailAddress": email_address,
                    "Name": name,
                    "CustomFields": custom_params,
                    "ConsentToTrack": "Unchanged",
                }
            )
        api_client.import_subscribers(
            settings.CAMPAIGN_MONITOR_LIST_ID, subscribers, resubscribe=False
        )
