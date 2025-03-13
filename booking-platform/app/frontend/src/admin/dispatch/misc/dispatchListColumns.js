import { Tag } from 'antd';
import cx from 'classnames';
import moment from 'moment';
import React from 'react';

import BookingStatusIcon from '../../booking/components/BookingStatusIcon';
import DispatchListFormItem from '../components/DispatchListFormItem';
import { BookingType, ClientUserPriority } from '../../../choiceConstants';

import styles from '../dispatch.less';

function abbreviateMelbourneAirport(value) {
    // Replace 'Melbourne Airport' with 'MAP' if there is exactly one occurrence of 'Melbourne Airport' in the string.
    // If there are 0 or multiple occurrences, don't attempt to modify the value at all.
    const regex = /Melbourne Airport/g;
    const match = value.match(regex);
    if (match && match.length === 1) {
        return value.replace(regex, 'MAP');
    }
    return value;
}

export function getColumns(options) {
    const { dryRun = false, ...itemFunctions } = options;
    const columns = [
        {
            dataKey: 'bookingNumber',
            label: 'Booking',
            width: 120,
        },
        {
            dataKey: 'travelOn',
            label: 'Time',
            render(value) {
                return moment(value).format('HH:mm');
            },
            width: 60,
        },
        {
            dataKey: 'passengerName',
            label: 'Pax',
            width: 180,
            render(value) {
                return value;
            },
        },
        {
            dataKey: 'fromSuburb',
            label: 'Pickup',
            width: 160,
            render: abbreviateMelbourneAirport,
        },
        {
            dataKey: 'toSuburb',
            label: 'Destination',
            width: 160,
            render(value, record) {
                if (
                    record.bookingType === BookingType.HOURLY.value &&
                    record.bookingAdditionalStops.size > 0
                ) {
                    return record.bookingAdditionalStops
                        .toArray()
                        .filter((stop, i) => record.bookingAdditionalStops.size - 1 === i)
                        .map(stop => (
                            <React.Fragment key={stop.id}>{stop.address.suburb}</React.Fragment>
                        ));
                }

                return abbreviateMelbourneAirport(value);
            },
        },
        {
            align: 'right',
            dataKey: 'passengerBaggageCount',
            label: 'P/B',
            width: 60,
            render(value, record) {
                return `${record.passengerCount}/${record.baggageCount}`;
            },
        },
        {
            align: 'right',
            dataKey: 'convoyNumber',
            label: 'Cnv',
            className: cx(styles.dispatchFormField, styles.dispatchConvoyColumn, 'convoyNumber'),
            render(value, record) {
                return (
                    <DispatchListFormItem
                        fieldName="convoyNumber"
                        record={record}
                        value={value}
                        {...itemFunctions}
                    />
                );
            },
            width: 60,
        },
        {
            dataKey: 'car',
            label: 'Car',
            width: 60,
        },
        {
            dataKey: 'options',
            label: 'Requests',
            width: 160,
            render(value, record) {
                return (
                    <div className={styles.optionColumn}>
                        {record.bookingPriority === ClientUserPriority.HIGH.value && (
                            <Tag color="#f20" className={styles.bookingPriorityTag}>
                                {record.bookingPriority}
                            </Tag>
                        )}
                        {record.bookingPriority === ClientUserPriority.MID.value && (
                            <Tag color="#f38701" className={styles.bookingPriorityTag}>
                                {record.bookingPriority}
                            </Tag>
                        )}
                        {value}
                    </div>
                );
            },
        },
        {
            dataKey: 'runNumber',
            label: 'Run',
            className: cx(styles.dispatchFormField, 'runNumber'),
            render(value, record) {
                return (
                    <DispatchListFormItem
                        fieldName={'runNumber'}
                        record={record}
                        value={value}
                        transformValue={newValue => (newValue ? Number(newValue) : null)}
                        narrow
                        {...itemFunctions}
                    />
                );
            },
            width: 60,
        },
        {
            dataKey: 'pencilNote',
            label: 'Pen',
            className: cx(styles.dispatchFormField, 'pencilNote'),
            render(value, record) {
                return (
                    <DispatchListFormItem
                        fieldName={'pencilNote'}
                        record={record}
                        value={value}
                        narrow
                        {...itemFunctions}
                    />
                );
            },
            width: 60,
        },
        {
            className: cx(styles.dispatchFormField, 'driverNumber'),
            dataKey: 'driverNumber',
            label: 'Drv',
            width: 60,
            render(value, record) {
                return (
                    <DispatchListFormItem
                        fieldName={'driverNumber'}
                        record={record}
                        value={value}
                        narrow
                        {...itemFunctions}
                    />
                );
            },
        },
        {
            dataKey: 'bookingStatus',
            label: 'Status',
            render(value) {
                return <BookingStatusIcon value={value} />;
            },
            width: 90,
        },
        {
            dataKey: 'pay',
            label: 'Pay',
            width: 100,
            render(value) {
                if (value === 'DC') {
                    return <strong>DC</strong>;
                }
                return value;
            },
        },
    ];
    return dryRun ? columns.map(column => column.dataKey) : columns;
}
