from decimal import Decimal


def get_client_facing_breakdown(price_breakdown):
    """Get breakdown suitable for displaying to clients

    Returns a list of dicts with a label and key"""
    currency_format = "$%.2f"
    options = price_breakdown.get("options")
    option_total = Decimal("0")
    if options:
        for key in ["ribbon", "color", "child_seats", "car_park_pass"]:
            option_total += Decimal(options.get(key, "0"))
    fees = price_breakdown["fees"]
    surcharge = Decimal(fees.get("event", 0) or 0)
    base = price_breakdown.get("base")
    result = []
    if base:
        surcharge += Decimal(base.get("out_of_hours", 0)) + Decimal(base.get("peak", 0))
        if base.get("distance"):
            result.append({"label": "Distance", "value": f"{base['distance']} km"})
        if base.get("time"):
            result.append({"label": "Time", "value": base["time"]})
    fee_descriptors = {
        "interstate": "Interstate Booking",
        "airport": "Airport Fee",
        "airport_parking": "Airport Parking",
        "out_of_area": "Out of Metro Area",
    }
    total_fees = 0
    fee_result = []
    for fee_key in ["interstate", "airport", "airport_parking", "out_of_area"]:
        if fee_key in fees:
            value = Decimal(fees[fee_key])
            fee_result.append(
                {"label": fee_descriptors[fee_key], "value": currency_format % value}
            )
            total_fees += value
    if fees.get("government"):
        total_fees += Decimal(fees["government"])
    travel_charge = (
        Decimal(price_breakdown["total"]) - surcharge - option_total - total_fees
    )
    if travel_charge > 0:
        result.append(
            {"label": "Travel Charge", "value": currency_format % travel_charge}
        )
    if surcharge != Decimal("0"):
        result.append(
            {
                "label": "Time Surcharge",
                "value": (
                    currency_format % surcharge
                    if surcharge > 0
                    else "-" + currency_format % -surcharge
                ),
            }
        )
    if option_total > 0:
        result.append(
            {"label": "Optional Extras", "value": currency_format % option_total}
        )
    result += fee_result
    if fees.get("government"):
        # May not always apply, eg. interstate bookings
        result.append(
            {
                "label": "State Gov Fees",
                "value": currency_format % Decimal(fees["government"]),
            }
        )
    return result
