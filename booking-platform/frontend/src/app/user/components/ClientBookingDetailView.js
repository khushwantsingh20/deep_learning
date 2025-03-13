import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import DetailGridView from '@alliance-software/djrad/components/model/DetailGridView';
import FieldFormatter from '@alliance-software/djrad/components/model/FieldFormatter';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { List } from 'antd';
import moment from 'moment';
import React from 'react';
import { BookingAddressType } from '../../../choiceConstants';
import DestinationAddressFormatter from '../../../common/components/DestinationAddressFormatter';
import FromAddressFormatter from '../../../common/components/FromAddressFormatter';
import { Booking } from '../models';

import styles from './ClientBookingDetailView.less';

function ClientBookingDetailView({ record }) {
    const {
        bookingNumber,
        passengerFullname,
        travelOnDate: travelOnDateRaw,
        travelOnTime: travelOnTimeRaw,
        fromAddressType,
    } = record;

    const travelOnDate = travelOnDateRaw.format('dddd, Do MMMM YYYY');
    const travelOnTime = moment(travelOnTimeRaw, 'HH:mm').format('LT');

    const fields = [
        'bookingNumber',
        'bookingType',
        'account',
        {
            label: 'Passenger',
            dataIndex: 'passenger',
            key: 'passenger',
            render(r) {
                return (
                    <React.Fragment>
                        <FieldFormatter record={r} fieldName={'passenger'} /> -{' '}
                        {r.passengerPhone || r.clientPhoneNumber}
                    </React.Fragment>
                );
            },
        },
        {
            label: 'Date/Time',
            dataIndex: 'travelOnDate',
            key: 'travelOnDate',
            render: () => `${travelOnDate} ${travelOnTime}`,
        },
        {
            label: 'From',
            dataIndex: 'fromAddress',
            key: 'fromAddress',
            render(r) {
                return <FromAddressFormatter booking={r} />;
            },
        },
        {
            label: 'Destination Address',
            dataIndex: 'destinationAddress',
            key: 'destinationAddress',
            render(r) {
                return <DestinationAddressFormatter booking={r} />;
            },
        },
        {
            label: 'Additional Stops',
            dataIndex: 'additionalStopsDetail',
            key: 'additionalStops',
            render(r) {
                const value = r.additionalStopsDetail;
                if (value.size === 0) {
                    return 'Nil';
                }
                return (
                    <List className={styles.additionalStops}>
                        {value.map(address => (
                            <List.Item key={address.id}>
                                <List.Item.Meta
                                    title={address.formattedAddress}
                                    description={address.addressInstructions}
                                />
                            </List.Item>
                        ))}
                    </List>
                );
            },
        },
        'passengerCount',
        'baggageCount',
        'vehicleClass',
        'vehicleColor',
        'boosterSeatCount',
        'forwardFacingBabySeatCount',
        'rearFacingBabySeatCount',
        'requiresWeddingRibbons',
        'hourlyBookingDuration',
        'driverNotes',
        'officeNotes',
        'purchaseOrderNumber',
        'signboardText',
        'priceTotal',
    ].filter(fieldName => record.get(fieldName) || record.get(fieldName.dataIndex));

    if (fromAddressType === BookingAddressType.AIRPORT.value) {
        fields.push('fromAirportDriverRequiredOnLanding');
    }

    return (
        <div className="container">
            <p>
                <ActionLink model={Booking} action={'list'}>
                    &lt; Back to my bookings
                </ActionLink>
            </p>
            <h2 className={styles.heading}>
                Booking &ndash; {bookingNumber}
                {record.canUserUpdate() && (
                    <ActionLink record={record} action="update" linkComponent={ButtonLink}>
                        Update
                    </ActionLink>
                )}
            </h2>
            <h3 className={styles.subHead}>
                Booked for: {passengerFullname} to travel on {travelOnDate} at {travelOnTime}
            </h3>

            <DetailGridView record={record} footer={false} fields={fields} />
        </div>
    );
}

export default ClientBookingDetailView;

ClientBookingDetailView.propTypes = {
    record: modelInstance('scbp_core.booking'),
};
