import ButtonBar from '@alliance-software/djrad/components/form/ButtonBar';
import FormButton, { FORM_ACTIONS } from '@alliance-software/djrad/components/form/FormButton';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import FieldFormatter from '@alliance-software/djrad/components/model/FieldFormatter';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { Col, Row } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import { BookingMethod, BookingStatus, BookingType } from '../../../choiceConstants';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import { getColumnFieldNames } from '../../../common/data/util';
import ListView from '../../crud/ListView';
import { HolidayModel } from '../../pricing/models';

import styles from '../booking.less';
import { Booking } from '../models';

const { Item } = ScbpModelFilterForm;

function BookingFilterForm(props) {
    const footer = (
        <ButtonBar
            leftButtons={
                <>
                    <FormButton type="primary" htmlType="submit">
                        Search
                    </FormButton>
                    <FormButton action={FORM_ACTIONS.CLEAR}>Clear</FormButton>
                </>
            }
        />
    );

    return (
        <ScbpModelFilterForm model={HolidayModel} layout="horizontal" footer={footer} {...props}>
            <Row>
                <Col span={12}>
                    <Item name="bookingNumber" className={styles.largeNumberField} />
                    <Item name="clientUser" label="Client" />
                    <Item name="phoneNumber" label="Passenger Phone" />
                    <Item name="bookingStatus" />
                </Col>
                <Col span={12}>
                    <Item name="travelDateRange" />
                    <Item name="account" />
                    <Item name="bookingMethod" />
                    <Item name="legacyHasInvalidAddress" label="Invalid address from import" />
                </Col>
            </Row>
        </ScbpModelFilterForm>
    );
}

function BookingActionLink(props) {
    if (
        props.action === 'update' &&
        [BookingStatus.UNVERIFIED.value, BookingStatus.CHANGED.value].includes(
            props.record.bookingStatus
        )
    ) {
        return (
            <Link target="_booking_update" {...props}>
                View
            </Link>
        );
    }
    return <Link target="_booking_update" {...props} />;
}

BookingActionLink.propTypes = {
    action: PropTypes.string.isRequired,
    record: modelInstance('scbp_core.booking').isRequired,
};

/**
 * NOTE: if you add new fields here note that BookingUnverifiedListView also uses this. Because
 * of how the polling works on unverified bookings you'll need to update the partialRecordFieldNames
 * in the useUnverifiedBookings hook.
 *
 * NOTE: Do not add or reorder columns here without checking BookingUnverifiedListView and BookingListView
 * (as well as any other future uses of this variable) - such changes will affect the functionality
 * of those two views
 */
export const bookingListColumns = [
    {
        dataIndex: 'travelOn',
        title: 'Date',
        width: 100,
        render(value) {
            return moment(value).format('DD/MM/YYYY');
        },
        key: 'date',
    },
    {
        dataIndex: 'travelOn',
        title: 'Time',
        width: 60,
        render(value) {
            return moment(value).format('HH:mm');
        },
        key: 'time',
        sorter: false,
    },
    {
        dataIndex: 'bookingNumber',
        title: 'Bkg No.',
        width: 90,
        className: 'alignRight',
    },
    { dataIndex: 'clientUserFullname', title: 'Client' },
    {
        dataIndex: 'account',
        title: 'Billing account',
        render(value, record) {
            return <FieldFormatter record={record} fieldName="account" />;
        },
    },
    {
        title: 'From Suburb',
        dataIndex: 'fromAddress',
        render(value) {
            return value ? value.suburb : '';
        },
    },
    {
        title: 'To Suburb',
        dataIndex: 'destinationAddress',
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
            return value ? value.suburb : '';
        },
    },
    {
        dataIndex: 'vehicleClass',
        title: 'Vehicle',
        width: 80,
        render(value, record) {
            if (record.vehicleClassName === 'Flexible' || record.vehicleClassName === 'Any Class') {
                return '';
            }
            return <FieldFormatter record={record} fieldName="vehicleClass" />;
        },
    },
    {
        dataIndex: 'bookingStatus',
        title: 'Status',
        width: 100,
    },
    {
        dataIndex: 'bookingMethod',
        title: 'Method',
        width: 70,
        render(value, record) {
            if (record.bookingMethod === BookingMethod.WEBSITE.value) {
                return 'BP';
            } else if (record.bookingMethod === BookingMethod.APP.value) {
                return 'AP';
            }

            return <FieldFormatter record={record} fieldName="bookingMethod" />;
        },
    },
    {
        dataIndex: 'actions',
        width: 80,
        render(value, record) {
            return (
                <ActionLinkList
                    record={record}
                    actions={['update']}
                    linkProps={{ record }}
                    linkComponent={BookingActionLink}
                />
            );
        },
    },
];
function RawBookingListView(props) {
    const partialRecordFieldNames = getColumnFieldNames(Booking, bookingListColumns);
    partialRecordFieldNames.push('bookingAdditionalStops');
    partialRecordFieldNames.push('bookingType');
    partialRecordFieldNames.push('vehicleClassName');
    partialRecordFieldNames.push('account__relatedLabel');
    const renderFilter = filterProps => <BookingFilterForm {...filterProps} />;
    return (
        <ListView
            {...props}
            columns={bookingListColumns}
            renderFilter={renderFilter}
            partialRecordFieldNames={partialRecordFieldNames}
            sortableFields={[
                'travelOn',
                'bookingNumber',
                'clientUserFullname',
                'account',
                'vehicleClass',
                'bookingStatus',
                'bookingMethod',
                'fromAddress',
                'destinationAddress',
            ]}
        />
    );
}

export default requirePermissions({ action: 'list', model: Booking })(RawBookingListView);
