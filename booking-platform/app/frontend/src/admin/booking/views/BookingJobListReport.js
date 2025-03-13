import Breadcrumb from '@alliance-software/djrad/components/breadcrumbs/Breadcrumb';
import DelimitedList from '@alliance-software/djrad/components/DelimitedList';
import CheckboxWidget from '@alliance-software/djrad/components/form/widgets/CheckboxWidget';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import BodyStyle from 'alliance-react/lib/BodyStyle';
import { Button } from 'antd';
import moment from 'moment';
import React from 'react';
import { BookingType } from '../../../choiceConstants';

import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import DestinationAddressFormatter from '../../../common/components/DestinationAddressFormatter';
import FromAddressFormatter from '../../../common/components/FromAddressFormatter';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { formatPhoneNumber, getColumnFieldNames } from '../../../common/data/util';
import DateTimeSplitWidget from '../../../common/form/DateTimeSplitWidget';
import DateWidget from '../../../common/form/DateWidget';
import TimeWidget from '../../../common/form/TimeWidget';
import { formatPlaceName } from '../../../common/formatters/address';
import BookingStatusIcon from '../components/BookingStatusIcon';
import ListView from '../../crud/ListView';
import { Booking } from '../models';
import styles from './BookingJobListReport.less';

const { Item } = ScbpModelFilterForm;

const PAGE_SIZE_LIMIT = 300;

export const columns = [
    {
        width: 30,
        dataIndex: 'rowNumber',
        title: '',
        render(value, record, index) {
            return index + 1;
        },
        className: styles.rowNumber,
    },
    {
        dataIndex: 'bookingNumber',
        title: 'Job No.',
        width: 65,
    },
    {
        dataIndex: 'travelOn',
        title: 'Time',
        width: 45,
        render(value) {
            return <strong>{moment(value).format('HH:mm')}</strong>;
        },
        key: 'time',
    },
    {
        dataIndex: 'passengerFullname',
        title: 'Passenger',
        render(value, record) {
            return (
                <>
                    {value}
                    <br />
                    {formatPhoneNumber(record.passengerOrClientPhone)}
                </>
            );
        },
    },
    {
        title: 'Pick Up',
        dataIndex: 'fromAddress',
        render(value, record) {
            return (
                <>
                    <FromAddressFormatter booking={record} suburbFirst />
                    <div>{record.fromAddress.addressInstructions}</div>
                </>
            );
        },
    },
    {
        title: 'Destination',
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
                        <div key={stop.id}>
                            <strong>{stop.address.suburb}</strong>
                            <br />
                            {stop.address.placeName && (
                                <>
                                    {stop.address.placeName}
                                    <br />
                                </>
                            )}
                            {stop.address.formattedAddress.split(',').slice(0, -1)}
                            {stop.address.addressInstructions && (
                                <div>{stop.address.addressInstructions}</div>
                            )}
                        </div>
                    ));
            }

            return (
                <>
                    <DestinationAddressFormatter booking={record} suburbFirst brief />
                    <div>{record.destinationAddress.addressInstructions}</div>

                    {record.bookingAdditionalStops.size > 0 && (
                        <>
                            <br />
                            <div>
                                {record.bookingAdditionalStops.map(stop => {
                                    return (
                                        <div key={stop.id}>
                                            <div>
                                                <strong>{stop.address.suburb}</strong>
                                            </div>
                                            {formatPlaceName(
                                                stop.address.placeName,
                                                stop.address.formattedAddress
                                            )}
                                            {stop.address.formattedAddress.split(',').slice(0, -1)}
                                            {stop.address.addressInstructions && (
                                                <div>{stop.address.addressInstructions}</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </>
            );
        },
    },
    {
        dataIndex: 'vehicleClassAbbreviation',
        title: 'Car',
        width: 50,
        render(value, record) {
            if (record.vehicleClassName === 'Flexible' || record.vehicleClassName === 'Any Class') {
                return '';
            }
            return value;
        },
    },
    {
        dataIndex: 'extras',
        title: 'Req.',
        render(value, record) {
            const items = [];
            if (record.requiresWeddingRibbons) {
                items.push('Ribbon');
            }
            if (record.vehicleColorTitle) {
                items.push(record.vehicleColorTitle);
            }
            const seatCount = [];
            if (record.forwardFacingBabySeatCount) {
                seatCount.push(`${record.forwardFacingBabySeatCount}xFWD`);
            }
            if (record.rearFacingBabySeatCount) {
                seatCount.push(`${record.forwardFacingBabySeatCount}xREAR`);
            }
            if (record.boosterSeatCount) {
                seatCount.push(`${record.forwardFacingBabySeatCount}xBOOST`);
            }
            items.push(seatCount.join(', '));
            if (record.requiresCarParkPass) {
                items.push('BHP Pass');
            }
            if (record.requestedDriverNo) {
                items.push(`Driver ${record.requestedDriverNo}`);
            }

            return items.map(item => (
                <>
                    {item}
                    <br />
                </>
            ));
        },
    },
    { dataIndex: 'driverNo', title: 'Driv.', className: 'alignRight', width: 45 },
    {
        dataIndex: 'bookingStatus',
        title: 'Status',
        width: 80,
        render(value) {
            return <BookingStatusIcon value={value} />;
        },
        className: 'alignCenter',
    },
];

function BookingFilterForm(props) {
    const formName = 'jobListFilter';
    const formValues = useFormValues(formName, ['travelOnFrom']);
    const formActions = useFormActions(formName);

    function minimumToDate(current) {
        if (!formValues.travelOnFrom) {
            return false;
        }
        const travelOnFrom = moment(formValues.travelOnFrom);
        return current && current.isBefore(travelOnFrom);
    }

    function setToday() {
        const travelOnFrom = moment().startOf('day');
        const travelOnTo = moment()
            .add(1, 'day')
            .startOf('day');
        formActions.change('travelOnFrom', travelOnFrom.format());
        formActions.change('travelOnTo', travelOnTo.format());
    }

    function setTonight() {
        const travelOnFrom = moment()
            .set('hour', 22)
            .set('minute', 0)
            .set('second', 0);
        const travelOnTo = moment()
            .add(1, 'day')
            .startOf('day')
            .set('hour', 2)
            .set('minute', 0)
            .set('second', 0);
        formActions.change('travelOnFrom', travelOnFrom.format());
        formActions.change('travelOnTo', travelOnTo.format());
    }

    function setTomorrow() {
        const travelOnFrom = moment()
            .startOf('day')
            .add(1, 'day');
        const travelOnTo = moment()
            .add(2, 'day')
            .startOf('day');
        formActions.change('travelOnFrom', travelOnFrom.format());
        formActions.change('travelOnTo', travelOnTo.format());
    }

    return (
        <ScbpModelFilterForm
            model={Booking}
            layout="inline"
            footer={
                <Item label=" " colon={false}>
                    <DelimitedList>
                        <Button onClick={setToday} type="primary">
                            Today
                        </Button>
                        <Button onClick={setTonight} type="primary">
                            Tonight
                        </Button>
                        <Button onClick={setTomorrow} type="primary">
                            Tomorrow
                        </Button>
                    </DelimitedList>
                </Item>
            }
            {...props}
            name={formName}
            onChange={() => {
                formActions.submit();
            }}
        >
            <Item label="From">
                <ScbpModelForm.Field
                    name="travelOnFrom"
                    widget={DateTimeSplitWidget}
                    renderWidgets={({ onDateChange, dateValue, onTimeChange, timeValue }) => (
                        <>
                            <DateWidget
                                allowClear={false}
                                onChange={onDateChange}
                                onBlur={() => {}}
                                showToday={false}
                                value={dateValue}
                            />{' '}
                            <TimeWidget
                                minuteStep={30}
                                use12Hours
                                format="hh:mm a"
                                onChange={onTimeChange}
                                value={timeValue}
                            />
                        </>
                    )}
                />
            </Item>

            <Item label="To">
                <ScbpModelForm.Field
                    name="travelOnTo"
                    widget={DateTimeSplitWidget}
                    renderWidgets={({ onDateChange, dateValue, onTimeChange, timeValue }) => (
                        <>
                            <DateWidget
                                allowClear={false}
                                disabledDate={minimumToDate}
                                onChange={onDateChange}
                                onBlur={() => {}}
                                showToday={false}
                                value={dateValue}
                            />{' '}
                            <TimeWidget
                                minuteStep={30}
                                use12Hours
                                format="hh:mm a"
                                onChange={onTimeChange}
                                value={timeValue}
                            />
                        </>
                    )}
                />
            </Item>
            <Item name="hideCancelledStatus" widget={CheckboxWidget} />
        </ScbpModelFilterForm>
    );
}

function BookingJobListReport(props) {
    const partialRecordFieldNames = [
        ...getColumnFieldNames(Booking, columns),
        'account__relatedLabel',
        'bookingAdditionalStops',
        'fromAddressType',
        'fromFlightNumber',
        'fromAirportDriverRequiredOnLanding',
        'fromAirportNotesForDriver',
        'fromAirportArrivalAfterLanding',
        'destinationAddressType',
        'destinationAddress',
        'destinationAirportTerminal',
        'destinationFlightDepartureTime',
        'vehicleClassName',
        'vehicleClassAbbreviation',
        'bookingType',
        'forwardFacingBabySeatCount',
        'rearFacingBabySeatCount',
        'boosterSeatCount',
        'requiresWeddingRibbons',
        'vehicleColorTitle',
        'requestedDriverNo',
        'requiresCarParkPass',
        'passengerFullname',
        'passengerOrClientPhone',
    ];

    const renderFilter = filterProps => <BookingFilterForm {...filterProps} />;
    const initialFilterState = {
        travelOnFrom: moment()
            .startOf('day')
            .format(),
        travelOnTo: moment()
            .add(1, 'day')
            .startOf('day')
            .format(),
        hideCancelledStatus: true,
    };
    return (
        <BodyStyle className={styles.jobListing}>
            <div>
                <Breadcrumb to={props.match.url}>Job Listing</Breadcrumb>
                <ListView
                    {...props}
                    header="Job Listing"
                    htmlTitle="Job Listing"
                    initialFilterState={initialFilterState}
                    extraTableProps={{
                        pagination: {
                            showTotal: (...args) => {
                                const total = args[0];
                                if (total > PAGE_SIZE_LIMIT) {
                                    return (
                                        <h2>
                                            {total.toLocaleString()} bookings found. Only the first{' '}
                                            {PAGE_SIZE_LIMIT} records are shown. Apply filters to
                                            narrow results.
                                        </h2>
                                    );
                                }
                                return <h2>{total.toLocaleString()} bookings</h2>;
                            },
                        },
                    }}
                    baseFilter={{
                        pageSize: PAGE_SIZE_LIMIT,
                        ordering: 'travelOn',
                    }}
                    columns={columns}
                    renderFilter={renderFilter}
                    partialRecordFieldNames={partialRecordFieldNames}
                />
            </div>
        </BodyStyle>
    );
}

export default requirePermissions({ action: 'jobListReport', model: Booking })(
    BookingJobListReport
);
