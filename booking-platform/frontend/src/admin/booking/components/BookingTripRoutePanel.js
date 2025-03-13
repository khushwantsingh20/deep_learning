import PropTypes from 'prop-types';
import ListWidget from '@alliance-software/djrad/components/form/widgets/ListWidget';
import useSettings from '@alliance-software/djrad/hooks/useSettings';
import { Button, Row, Col } from 'antd';
import React, { useEffect } from 'react';
import { FieldArray } from 'redux-form';
import { BookingType } from '../../../choiceConstants';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import AddressLookupWidget from '../../../common/form/AddressLookupWidget';
import { numeric } from '../../../common/prop-types';
import { ReactComponent as IconPlus } from '../../../images/icon-plus-circle.svg';
import BookingAddressEntry from './BookingAddressEntry';
import BookingPanel from './BookingEntryPanel';
import BookingValueWidget, { BookingValueRenderer } from './BookingValueWidget';

import styles from './BookingTripRoutePanel.less';

const { Item, Field } = ScbpModelForm;

function AdditionalStopWidget({ clientUserId, min, ...props }) {
    useEffect(() => {
        // If min has changed we need to add the item. This happens when changing
        // from one way trip to hourly
        if (min > 0 && props.fields.length === 0) {
            props.fields.push();
        }
    }, [min, props.fields]);
    return (
        <ListWidget
            min={min}
            max={10}
            renderItem={(fieldName, { onRemove, index, fields, canRemove }) => (
                <BookingAddressEntry
                    label="Additional stops enroute:"
                    name={fieldName}
                    showLabel={index === 0}
                    canRemove={canRemove}
                    onRemove={onRemove}
                    onSortChange={direction => fields.move(index, index + direction)}
                    sortIndex={index}
                    sortIndexMax={fields.length - 1}
                    isAdditionalStop
                    clientUserId={clientUserId}
                />
            )}
            renderAddNewButton={({ onAdd, canAdd }) =>
                canAdd && (
                    <BookingValueRenderer
                        fieldName="additionalStops"
                        renderWrite={() => (
                            <Button type="link" onClick={onAdd} className={styles.addDestination}>
                                <IconPlus />
                                Additional stop enroute
                            </Button>
                        )}
                        renderView={() => {
                            if (props.fields.length === 0) {
                                return (
                                    <div style={{ paddingTop: 20 }}>
                                        <em>No additional stops</em>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                )
            }
            inputWidget={AddressLookupWidget}
            {...props}
        />
    );
}

AdditionalStopWidget.propTypes = {
    min: PropTypes.number.isRequired,
    clientUserId: numeric,
    /** The fields object from redux-form FieldArray */
    fields: PropTypes.object,
};

export default function BookingTripRoutePanel({ bookingType, clientUserId, accountId }) {
    const { bookingLimits } = useSettings();
    return (
        <BookingPanel label="Trip Route">
            <Row gutter={30}>
                <Col span={8}>
                    <Item
                        name="bookingType"
                        wrapperCol={{ span: 16 }}
                        labelCol={{ span: 8 }}
                        fieldProps={{ allowClear: false }}
                        widget={BookingValueWidget}
                    />
                </Col>
                <Col span={16}>
                    {bookingType === BookingType.HOURLY.value && (
                        <Item
                            label=""
                            name="hourlyBookingDuration"
                            className={styles.hourlyDuration}
                            widget={BookingValueWidget}
                            fieldProps={{
                                minuteStep: 10,
                                maxDurationMinutes: bookingLimits.maxDurationHours * 60,
                                minDurationMinutes: bookingLimits.minDurationHours * 60,
                            }}
                        />
                    )}
                </Col>
            </Row>
            <BookingAddressEntry
                label="First pick up"
                name="fromAddress"
                clientUserId={clientUserId}
                accountId={accountId}
            />

            <Item className={styles.additionalStops}>
                <Field
                    reduxFormFieldComponent={FieldArray}
                    name="bookingAdditionalStops"
                    clientUserId={clientUserId}
                    min={bookingType === BookingType.HOURLY.value ? 1 : 0}
                    widget={AdditionalStopWidget}
                />
            </Item>

            {bookingType === BookingType.ONE_WAY.value && (
                <BookingAddressEntry
                    label="Final destination"
                    name="destinationAddress"
                    clientUserId={clientUserId}
                    accountId={accountId}
                />
            )}
        </BookingPanel>
    );
}

BookingTripRoutePanel.propTypes = {
    bookingType: PropTypes.oneOf([BookingType.HOURLY.value, BookingType.ONE_WAY.value]),
    clientUserId: numeric,
    accountId: numeric,
};
