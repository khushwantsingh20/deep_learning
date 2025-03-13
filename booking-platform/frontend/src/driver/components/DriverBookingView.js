import { Button, Popconfirm } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch } from 'react-redux';

import { updateModel } from '@alliance-software/djrad/actions';
import ButtonBar from '@alliance-software/djrad/components/form/ButtonBar';
import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import { modelClass } from '@alliance-software/djrad/prop-types/model';
import { BookingAddressType, BookingStatus, BookingType } from '../../choiceConstants';
import DestinationAddressFormatter from '../../common/components/DestinationAddressFormatter';
import FromAddressFormatter from '../../common/components/FromAddressFormatter';
import { formatAddress } from '../../common/formatters/address';

import { Booking } from '../models';
import { formatAuCurrency } from '../../common/formatters/numeric';

import styles from './DriverBookingView.less';

function DriverBookingButton({ data, record, token }) {
    const dispatch = useDispatch();
    const [label, newValue, requiresVerification] = data;

    const updateRecord = () => {
        const now = moment();
        const fiveMinutes = 5 * 60 * 1000;
        const nearest5Minutes = moment(Math.round(+now / fiveMinutes) * fiveMinutes);
        if (newValue === BookingStatus.PICKED_UP.value) {
            return dispatch(
                updateModel(record, { pickupTime: nearest5Minutes, bookingStatus: newValue, token })
            );
        } else if (
            newValue === BookingStatus.CLEARED.value ||
            newValue === BookingStatus.VARIATION.value
        ) {
            return dispatch(
                updateModel(record, {
                    dropoffTime: nearest5Minutes,
                    bookingStatus: newValue,
                    token,
                })
            );
        }

        return dispatch(updateModel(record, { bookingStatus: newValue, token }));
    };

    if (requiresVerification) {
        return (
            <Popconfirm
                title={`Are you sure you want to ${label} this booking?`}
                onConfirm={updateRecord}
                okText="Yes"
                cancelText="No"
            >
                <Button>{label}</Button>
            </Popconfirm>
        );
    }

    return <Button onClick={updateRecord}>{label}</Button>;
}

DriverBookingButton.propTypes = {
    data: PropTypes.array.isRequired,
    record: modelClass('scbp_core.booking'),
    token: PropTypes.string.isRequired,
};

export default function DriverBookingView(props) {
    const token = props.match.params.token;
    const { record, isLoading, error } = useGetModel(Booking, { token }, {});

    if (isLoading) {
        return <>Loading...</>;
    }
    if (error) {
        return <>Error - Unable to find booking</>;
    }

    const shouldShowDetails = record.id > 0 && record.displayStatus !== 'Cancelled';
    if (!shouldShowDetails) {
        return (
            <table className={styles.table}>
                <tbody>
                    <tr>
                        <th>Booking No.</th>
                        <td>{record.bookingNumber}</td>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <td>{record.displayStatus}</td>
                    </tr>
                </tbody>
            </table>
        );
    }

    const buttons = record.buttons.toJS();
    const footer = (
        <ButtonBar
            leftButtons={
                buttons[0] ? (
                    <DriverBookingButton data={buttons[0]} record={record} token={token} />
                ) : (
                    <></>
                )
            }
            rightButtons={
                buttons[1] ? (
                    <DriverBookingButton data={buttons[1]} record={record} token={token} />
                ) : (
                    <></>
                )
            }
        />
    );

    return (
        <>
            <table className={styles.table}>
                <tbody>
                    <tr>
                        <th>Booking No.</th>
                        <td>{record.bookingNumber}</td>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <td>{record.displayStatus}</td>
                    </tr>
                    <tr>
                        <th>Driver</th>
                        <td>{record.driver}</td>
                    </tr>
                    <tr>
                        <th>Date</th>
                        <td>{record.travelOnDate.format('DD/MM/YYYY dddd')}</td>
                    </tr>
                    <tr>
                        <th>Time</th>
                        <td>{moment(record.travelOnTime, ['HH:mm:ss']).format('HH:mm')}</td>
                    </tr>
                    <tr>
                        <th>Car Type</th>
                        <td>{record.vehicleClass}</td>
                    </tr>
                    <tr>
                        <th>No. of Pax</th>
                        <td>{record.passengerCount}</td>
                    </tr>
                    <tr>
                        <th>Checked Bags</th>
                        <td>{record.baggageCount}</td>
                    </tr>
                    <tr>
                        <th>Equipment</th>
                        <td>{record.equipment}</td>
                    </tr>
                    <tr>
                        <th>Passenger Name</th>
                        <td>
                            <div>{record.passenger}</div>
                            Ph: <a href={'tel:' + record.passengerPhone}>{record.passengerPhone}</a>
                        </td>
                    </tr>
                    <tr className={styles.adr}>
                        <th>Pick Up</th>
                        <td>
                            <FromAddressFormatter booking={record} />
                        </td>
                    </tr>

                    {record.fromAddressType === BookingAddressType.AIRPORT.value &&
                        record.fromAirportNotesForDriver && (
                            <tr>
                                <th>Airport notes</th>
                                <td>{record.fromAirportNotesForDriver}</td>
                            </tr>
                        )}
                    {record.hourlyBookingDuration && (
                        <tr>
                            <th>Booking duration</th>
                            <td>{record.hourlyBookingDuration}</td>
                        </tr>
                    )}
                    <tr>
                        <th>Instructions</th>
                        <td>{record.fromAddress.addressInstructions || 'None'}</td>
                    </tr>
                    {record.signboardText && (
                        <tr>
                            <th>Signboard text</th>
                            <td>{record.signboardText}</td>
                        </tr>
                    )}
                    {record.bookingAdditionalStops.size > 0 && (
                        <tr className={styles.adr}>
                            <th>Additional Stops</th>
                            <td>
                                <ol>
                                    {record.bookingAdditionalStops.map(stop => (
                                        <li key={stop.id}>
                                            {formatAddress(stop.address.formattedAddress)}
                                            {stop.address.addressInstructions ? (
                                                <div>
                                                    <br />
                                                    Instructions:
                                                    <br />
                                                    {stop.address.addressInstructions}
                                                </div>
                                            ) : (
                                                ''
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            </td>
                        </tr>
                    )}
                    <tr className={styles.adr}>
                        <th>Destination</th>
                        <td>
                            {record.bookingType === BookingType.HOURLY.value &&
                            record.bookingAdditionalStops.size > 0 ? (
                                <>
                                    {record.bookingAdditionalStops
                                        .filter(
                                            (stop, i) =>
                                                record.bookingAdditionalStops.size - 1 === i
                                        )
                                        .map((stop, i) => (
                                            <div key={`${stop.id}-${i}`}>
                                                {stop.address.formattedAddress}
                                            </div>
                                        ))}
                                </>
                            ) : (
                                <DestinationAddressFormatter booking={record} />
                            )}
                        </td>
                    </tr>
                    {record.destinationAddress && (
                        <tr>
                            <th>Instructions</th>
                            <td>{record.destinationAddress.addressInstructions || 'None'}</td>
                        </tr>
                    )}
                    <tr>
                        <th>Payment</th>
                        <td>{record.paymentMethod}</td>
                    </tr>
                    <tr>
                        <th>Job Value</th>
                        <td>{formatAuCurrency(record.bookingValue)}</td>
                    </tr>
                    <tr>
                        <th>Other Instructions</th>
                        <td>{record.driverNotes || 'None'}</td>
                    </tr>
                </tbody>
            </table>
            {footer}
        </>
    );
}
