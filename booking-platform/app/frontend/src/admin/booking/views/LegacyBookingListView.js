import { modelDetailRoute } from '@alliance-software/djrad/actions';
import ButtonBar from '@alliance-software/djrad/components/form/ButtonBar';
import FormButton, { FORM_ACTIONS } from '@alliance-software/djrad/components/form/FormButton';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import FieldFormatter from '@alliance-software/djrad/components/model/FieldFormatter';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { Button, Col, Popconfirm, Row } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { BookingStatus, BookingType, BookingMethod } from '../../../choiceConstants';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { formatAuCurrency, formatPercentage } from '../../../common/formatters/numeric';
import ListView from '../../crud/ListView';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import { getColumnFieldNames } from '../../../common/data/util';
import { HolidayModel } from '../../pricing/models';
import { Booking } from '../models';

import styles from '../booking.less';

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
                    <Item name="bookingStatus" />
                </Col>
                <Col span={12}>
                    <Item name="travelDateRange" />
                    <Item name="account" />
                    <Item name="bookingMethod" />
                </Col>
            </Row>
        </ScbpModelFilterForm>
    );
}

function DismissLegacyBookingButton({ record }) {
    const { run, isLoading } = useAsyncRedux(() =>
        modelDetailRoute('post', record, 'set-legacy-review-status')
    );

    return (
        <Popconfirm
            title="This will remove the booking from this report. Continue?"
            onConfirm={run}
            okText="Yes"
            cancelText="No"
        >
            <Button loading={isLoading} type="link">
                Ignore
            </Button>
        </Popconfirm>
    );
}

DismissLegacyBookingButton.propTypes = {
    record: modelInstance('scbp_core.booking').isRequired,
};

function BookingActionLink(props) {
    if (props.action === 'setLegacyReviewStatus') {
        return <DismissLegacyBookingButton record={props.record} />;
    }
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

const bookingListColumns = [
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
        width: 60,
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
        dataIndex: 'priceTotal',
        title: 'New Price',
        className: 'alignRight',
        render(value) {
            return formatAuCurrency(value);
        },
    },
    {
        dataIndex: 'legacyPrice',
        title: 'Legacy Price',
        className: 'alignRight',
        render(value) {
            return formatAuCurrency(value);
        },
    },
    {
        dataIndex: 'variationAmount',
        title: 'Variation Amount',
        className: 'alignRight',
        render(value) {
            return formatAuCurrency(value);
        },
    },
    {
        dataIndex: 'legacyPriceVariance',
        title: 'Price Variance',
        className: 'alignRight',
        render(value) {
            return formatPercentage(value);
        },
    },
    {
        dataIndex: 'actions',
        width: 80,
        render(value, record) {
            return (
                <ActionLinkList
                    record={record}
                    actions={['update', 'setLegacyReviewStatus']}
                    linkProps={{ record }}
                    linkComponent={BookingActionLink}
                />
            );
        },
    },
];

function RawLegacyBookingListView(props) {
    const partialRecordFieldNames = getColumnFieldNames(Booking, bookingListColumns);
    partialRecordFieldNames.push('bookingAdditionalStops');
    partialRecordFieldNames.push('bookingType');
    partialRecordFieldNames.push('vehicleClassName');
    partialRecordFieldNames.push('account__relatedLabel');
    const renderFilter = filterProps => <BookingFilterForm {...filterProps} />;
    return (
        <ListView
            {...props}
            prologue={
                <p>
                    This report shows all imported bookings that had a travel date in the future
                    from the time of import. Each booking has had a variation created such that the
                    price calculated in the new system matches the old system.
                </p>
            }
            header="Legacy Bookings Price Variation Report"
            htmlTitle="Legacy Bookings Price Variation Report"
            columns={bookingListColumns}
            baseFilter={{ legacyListView: true }}
            renderFilter={renderFilter}
            extraTableProps={{
                label: 'Booking with price variation',
                labelPlural: 'Bookings with price variation',
            }}
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

export default requirePermissions({ action: 'listLegacy', model: Booking })(
    RawLegacyBookingListView
);
