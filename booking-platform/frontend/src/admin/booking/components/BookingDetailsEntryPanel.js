import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import { Col, Input, Row } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import cx from 'classnames';

import PassengerSelectFormItem from '../../../common/components/PassengerSelectFormItem';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { numeric } from '../../../common/prop-types';
import BookingValueWidget from './BookingValueWidget';
import BookingPanel from './BookingEntryPanel';
import { useAdminBooking } from '../adminBookingContext';

import styles from './BookingDetailsEntryPanel.less';
import timeWidgetStyles from '../../dispatch/dispatch.less';

const { Field, Item } = ScbpModelForm;

function BookingTimeWidget({ className, ...rest }) {
    return (
        <Input
            maxLength={4}
            className={cx(className, timeWidgetStyles.dispatchTimeInput)}
            {...rest}
        />
    );
}

BookingTimeWidget.propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.instanceOf(moment), // not isRequired because null is a valid value
};

export default function BookingDetailsEntryPanel({ formName, accountId, clientUserId }) {
    const { booking } = useAdminBooking();
    const passengerFormatter = ({ value }) => value || 'Guest';
    const dateFormatter = ({ value }) => moment(value).format('dddd, Do MMMM YYYY');
    const { travelOnDate, travelOnTime } = useFormValues(formName, [
        'travelOnDate',
        'travelOnTime',
    ]);
    let isDatePast = false;
    if (travelOnDate && travelOnTime) {
        const parseResult = moment(travelOnTime, ['HHmm', 'Hmm'], true);
        if (parseResult.isValid()) {
            const dateTime = moment(travelOnDate)
                .set('hour', parseResult.hour())
                .set('minute', parseResult.minute());
            isDatePast = dateTime.isBefore(moment());
        }
    }
    return (
        <BookingPanel label="Details">
            <PassengerSelectFormItem
                formName={formName}
                userId={clientUserId}
                account={accountId}
                renderItem={({ passengerField, guestLookup, guestFormatter }) => {
                    return (
                        <Row gutter={30}>
                            <Col span={8}>
                                <ScbpModelForm.Item name="passenger">
                                    <BookingValueWidget
                                        disabled={!clientUserId}
                                        formatterComponent={passengerFormatter}
                                        name="passenger"
                                        widget={passengerField}
                                    />
                                </ScbpModelForm.Item>
                            </Col>
                            <Col span={16}>
                                {guestLookup && clientUserId && (
                                    <BookingValueWidget
                                        booking={booking}
                                        formatterComponent={guestFormatter}
                                        layout="horizontal"
                                        name="passengerName"
                                        widget={guestLookup}
                                    />
                                )}
                            </Col>
                        </Row>
                    );
                }}
            />
            <Row gutter={30}>
                <Col span={9}>
                    <Item
                        warnings={isDatePast && 'Warning - this booking is for a date in the past'}
                    >
                        <div className={styles.travelOnWrapper}>
                            <div>
                                <div className="ant-col ant-form-item-label">
                                    <label htmlFor="travelOnDate">Travel Date:</label>
                                </div>
                                <Field
                                    name="travelOnDate"
                                    widget={
                                        <BookingValueWidget
                                            formatterComponent={dateFormatter}
                                            dropdownClassName={styles.datePicker}
                                        />
                                    }
                                />
                            </div>
                            <div>
                                <div className="ant-col ant-form-item-label">
                                    <label htmlFor="travelOnTime">Pick Up Time:</label>
                                </div>
                                <Field
                                    name="travelOnTime"
                                    widget={<BookingValueWidget widget={BookingTimeWidget} />}
                                />
                            </div>
                        </div>
                    </Item>
                </Col>
                <Col span={3}>
                    <Item name="isTimeTba" label="TBA" />
                </Col>
                <Col span={3} offset={1}>
                    <Item name="passengerCount" label="No. PAX" fieldProps={{ min: 0 }} />
                </Col>
                <Col span={3}>
                    <Item label="Child < 8" name="childUnder8Count" fieldProps={{ min: 0 }} />
                </Col>
                <Col span={3}>
                    <Item name="baggageCount" label="Baggage" fieldProps={{ min: 0 }} />
                </Col>
            </Row>
        </BookingPanel>
    );
}

BookingDetailsEntryPanel.propTypes = {
    formName: PropTypes.string.isRequired,
    accountId: numeric,
    clientUserId: numeric,
};
