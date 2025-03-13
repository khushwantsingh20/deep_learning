import FieldFormatter from '@alliance-software/djrad/components/model/FieldFormatter';
import { Button, Modal, Skeleton } from 'antd';
import capitalize from 'lodash/capitalize';
import moment from 'moment';
import { PropTypes } from 'prop-types';
import React from 'react';

import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import { RangeReduxFormField } from '@alliance-software/djrad/model/fields/RangeField';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';

import ScbpListTableView from '../../../common/data/ScbpListTableView';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import DateRangeSplitWidget from '../../../common/form/DateRangeSplitWidget';
import useListView from '../../../common/hooks/useListView';
import { buildModelApiUrl } from '../../../common/url';
import { Booking } from '../models';
import { BookingAddressType, BookingType } from '../../../choiceConstants';
import styles from '../views/UserProfileView.less';

function BookingListActionLinkComponent({ action, record }) {
    const actionHeaderLabel = { update: 'Update', cancel: 'Cancellation' }[action];
    const handleInterstateChangeClick = () =>
        Modal.error({
            title: `${actionHeaderLabel} Not Supported Here`,
            content: (
                <div>
                    Please call the office at 1300 12 LIMO to {action} this booking
                    <p>(use reference number {record.bookingNumber})</p>
                </div>
            ),
        });
    if (['update', 'cancel'].includes(action) && record.isInterstate) {
        return (
            <Button
                className={styles.bookingListLinkButton}
                onClick={handleInterstateChangeClick}
                type="link"
            >
                {capitalize(action)}
            </Button>
        );
    }
    return <ActionLink action={action} record={record} />;
}

BookingListActionLinkComponent.propTypes = {
    action: PropTypes.string.isRequired,
    record: modelInstance('scbp_core.booking').isRequired,
};

function BookingListFilterForm(props) {
    const formName = 'scbp_core.booking_filters';
    const formActions = useFormActions(formName);

    return (
        <ScbpModelFilterForm
            model={Booking}
            layout="inline"
            footer={null}
            onChange={formActions.submit}
            {...props}
            className={styles.bookingFilterForm}
            initialValues={{ account: props.accountId }}
            formName={formName}
        >
            <fieldset>
                <legend>Filters:</legend>
                <div>
                    <ScbpModelFilterForm.Item name="clientUser" label="Booked by" />
                    <ScbpModelFilterForm.Item name="passenger" label="For" />
                    <ScbpModelFilterForm.Item name="account" />
                    <ScbpModelFilterForm.Item label="Date range">
                        <ScbpModelFilterForm.Field
                            name="travelDateRange"
                            widget={DateRangeSplitWidget}
                            wrapperClassName={styles.bookingListDateRange}
                            reduxFormFieldComponent={RangeReduxFormField}
                        />
                    </ScbpModelFilterForm.Item>
                </div>
            </fieldset>
        </ScbpModelFilterForm>
    );
}

BookingListFilterForm.propTypes = {
    accountId: PropTypes.number,
};

function ClientBookingListView({ accountId }) {
    const { tableProps, filterProps, isInitialLoad } = useListView(Booking, [
        'clientUser',
        'clientAbbreviatedName',
        'passengerAbbreviatedName',
        'passengerCount',
        'fromAddress',
        'fromAddressType',
        'destinationAddress',
        'destinationAddressType',
        'hourlyBookingDuration',
        'vehicleClass',
        'priceTotal',
        'account',
        'bookingType',
        'bookingStatus',
        'bookingNumber',
        'bookingStatus',
        'isInterstate',
        'isModifiable',
        'travelOnTime',
        'travelOnDate',
    ]);

    const columns = [
        {
            dataIndex: 'travelOnDate',
            title: 'When',
            render(value, record) {
                let date = moment(value).format('ddd, Do MMM');
                const time = moment(record.travelOnTime, 'HH:mm:ss').format('h:mma');

                if (moment().year() !== moment(value).year()) {
                    const dateYear = moment(value).format('YYYY');
                    date = (
                        <>
                            {moment(value).format('ddd, Do MMM')}
                            <br />
                            {dateYear}
                        </>
                    );
                }
                return (
                    <>
                        <div>{time}</div>
                        <div>{date}</div>
                    </>
                );
            },
        },
        {
            dataIndex: 'bookingNumber',
            title: 'Booking No. / Status',
            render(value, record) {
                return (
                    <>
                        <div className={styles.bookingNo}>{value}</div>
                        <em>
                            <FieldFormatter
                                record={record}
                                fieldName="bookingStatus"
                                value={record.bookingStatus}
                            />
                        </em>
                    </>
                );
            },
        },
        { dataIndex: 'passengerAbbreviatedName', title: 'Passenger' },
        {
            dataIndex: 'fromAddress',
            title: 'Pick up',
            render: (text, record) =>
                text.addressLabel && record.fromAddressType !== BookingAddressType.AIRPORT.value ? (
                    <div>
                        <div>{text.addressLabel}</div>
                        {text.suburb ? text.suburb : text.formattedAdress}
                    </div>
                ) : text.suburb ? (
                    text.suburb
                ) : (
                    text.formattedAdress
                ),
        },
        {
            dataIndex: 'destinationAddress',
            title: 'Going to',
            render: (text, record) =>
                record.bookingType === BookingType.HOURLY.value ? (
                    `Duration: ${record.hourlyBookingDuration}`
                ) : text.addressLabel &&
                  record.destinationAddressType !== BookingAddressType.AIRPORT.value ? (
                    <div>
                        <div>{text.addressLabel}</div>
                        {text.suburb || text.formattedAddress}
                    </div>
                ) : (
                    text.suburb || text.formattedAddress
                ),
        },
        {
            dataIndex: 'clientAbbreviatedName',
            title: 'Details',
            render(value, record) {
                return (
                    <>
                        <div>
                            <FieldFormatter
                                record={record}
                                fieldName="vehicleClass"
                                value={record.vehicleClass}
                            />
                        </div>
                        <div>{record.passengerCount} Passenger/s</div>
                        <div>Booked by {value}</div>
                    </>
                );
            },
        },
        { dataIndex: 'priceTotal', title: 'Cost $', className: 'alignRight' },
        {
            dataIndex: 'actions',
            className: styles.actions,
            render(value, record) {
                return (
                    <ActionLinkList
                        record={record}
                        actions={
                            record.canUserUpdate() ? ['detail', 'update', 'cancel'] : ['detail']
                        }
                        listComponent={React.Fragment}
                        linkComponent={BookingListActionLinkComponent}
                        linkProps={{ record }}
                    />
                );
            },
        },
    ];

    const renderFilter = fProps => <BookingListFilterForm {...fProps} accountId={accountId} />;
    const downloadUrl = buildModelApiUrl(Booking, 'download');

    return (
        <div className={styles.bookingList}>
            <div className={styles.headerWithButton}>
                <h2 className={`${styles.actionHeading} h3`}>Bookings</h2>

                <Button href={downloadUrl} type="primary">
                    Export my booking history
                </Button>
            </div>
            {renderFilter && renderFilter(filterProps)}
            {isInitialLoad && <Skeleton />}
            {!isInitialLoad && <ScbpListTableView {...tableProps} columns={columns} />}
        </div>
    );
}

export default ClientBookingListView;

ClientBookingListView.propTypes = {
    accountId: PropTypes.number,
};
