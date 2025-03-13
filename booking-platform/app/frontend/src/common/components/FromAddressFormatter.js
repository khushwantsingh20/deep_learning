import React from 'react';
import { BookingAddressType } from '../../choiceConstants';
import { formatAddress, formatPlaceName } from '../formatters/address';

function FromAddressFormatter({ booking, brief, suburbFirst }) {
    let address = formatAddress(booking.fromAddress.formattedAddress);

    if (booking.fromAddressType === BookingAddressType.AIRPORT.value) {
        const airportLandingDetails = booking.fromAirportDriverRequiredOnLanding
            ? '/ from landing'
            : `/ plus ${booking.fromAirportArrivalAfterLanding} mins`;
        if (brief) {
            address = (
                <>
                    {booking.fromFlightNumber} {airportLandingDetails}
                </>
            );
        } else {
            address = (
                <span>
                    {suburbFirst ? (
                        <>
                            <strong>MAP</strong>
                            <br />
                        </>
                    ) : (
                        <>
                            Melbourne Airport
                            <br />
                        </>
                    )}
                    {booking.fromFlightNumber} {airportLandingDetails}
                </span>
            );
        }
    } else if (suburbFirst) {
        address = (
            <span>
                <div>
                    <strong>{booking.fromAddress.suburb}</strong>
                </div>
                {booking.fromAddress.placeName &&
                    formatPlaceName(
                        booking.fromAddress.placeName,
                        booking.fromAddress.formattedAddress
                    )}
                {booking.fromAddress.formattedAddress.split(',').slice(0, -1)}
            </span>
        );
    } else if (booking.fromAddress.addressLabel) {
        address = (
            <span>
                {booking.fromAddress.addressLabel}
                <br />
                {address}
            </span>
        );
    } else if (!booking.fromAddress.addressLabel && booking.fromAddress.placeName) {
        address = (
            <span>
                {formatPlaceName(
                    booking.fromAddress.placeName,
                    booking.fromAddress.formattedAddress
                )}
                {address}
            </span>
        );
    }

    return address;
}

export default FromAddressFormatter;
