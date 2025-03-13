import FieldFormatter from '@alliance-software/djrad/components/model/FieldFormatter';
import moment from 'moment';
import React from 'react';
import { BookingAddressType } from '../../choiceConstants';
import { formatAddress, formatPlaceName } from '../formatters/address';

/**
 * NOTE: Booking here may be a record or just a plain object so do not use
 * FieldFormatter in here (airportTerminalName is exception because it's
 * passed in explicitly)
 */
function DestinationAddressFormatter({
    booking,
    airportTerminalName,
    suburbFirst = false,
    brief = false,
}) {
    if (!booking.destinationAddress) {
        return null;
    }
    let address = formatAddress(booking.destinationAddress.formattedAddress);

    if (booking.destinationAddressType === BookingAddressType.AIRPORT.value) {
        if (!airportTerminalName) {
            airportTerminalName = (
                <FieldFormatter
                    record={booking}
                    value={booking.destinationAirportTerminal}
                    fieldName="destinationAirportTerminal"
                />
            );
        }

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
                {brief ? (
                    <>
                        T{booking.destinationAirportTerminal} ETD{' '}
                        {moment(booking.destinationFlightDepartureTime, 'HH:mm:ss').format('HHmm')}
                    </>
                ) : (
                    <>
                        {airportTerminalName && airportTerminalName}
                        <br />
                        Departing{' '}
                        {moment(booking.destinationFlightDepartureTime, 'HH:mm:ss').format(
                            'h:mm A'
                        )}
                    </>
                )}
            </span>
        );
    } else if (suburbFirst) {
        address = (
            <span>
                <div>
                    <strong>{booking.destinationAddress.suburb}</strong>
                </div>
                {booking.destinationAddress.placeName &&
                    formatPlaceName(
                        booking.destinationAddress.placeName,
                        booking.destinationAddress.formattedAddress
                    )}
                {booking.destinationAddress.formattedAddress.split(',').slice(0, -1)}
            </span>
        );
    } else if (booking.destinationAddress.addressLabel) {
        address = (
            <span>
                {booking.destinationAddress.addressLabel}
                <br />
                {address}
            </span>
        );
    } else if (!booking.destinationAddress.addressLabel && booking.destinationAddress.placeName) {
        address = (
            <span>
                {formatPlaceName(
                    booking.destinationAddress.placeName,
                    booking.destinationAddress.formattedAddress
                )}
                {address}
            </span>
        );
    }

    return address;
}

export default DestinationAddressFormatter;
