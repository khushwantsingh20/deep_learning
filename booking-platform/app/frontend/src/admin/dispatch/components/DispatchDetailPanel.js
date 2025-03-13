import DateFormatter from '@alliance-software/djrad/components/formatter/DateFormatter';
import { Alert, Button, Col, Input, Popover, Row, Spin } from 'antd';
import cx from 'classnames';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import reduce from 'lodash/reduce';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isSubmitting } from 'redux-form';

import ModelLookupWidget from '@alliance-software/djrad/components/form/widgets/ModelLookupWidget';
import SelectWidget from '@alliance-software/djrad/components/form/widgets/SelectWidget';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import DestinationAddressFormatter from '../../../common/components/DestinationAddressFormatter';
import FromAddressFormatter from '../../../common/components/FromAddressFormatter';
import { BookingPriceBreakdown, LegacyBookingPriceBreakdown } from '../../../common/records';
import BookingPricingLegacySummary from '../../booking/components/BookingPricingLegacySummary';
import PriceBreakdownTable from '../../booking/components/PriceBreakdownTable';
import ResendEmailButton from '../../components/ResendEmailButton';

import DispatchInstructionWidget from './DispatchInstructionWidget';
import DispatchBookingStatusWidget from './DispatchBookingStatusWidget';
import DispatchSendToDriverModal from './DispatchSendToDriverModal';
import DispatchTimeField from './DispatchTimeField';
import { DispatchBooking } from '../models';
import VariationOutOfPocketEntryModal from '../../booking/components/VariationOutOfPocketEntryModal';
import { Booking } from '../../booking/models';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { DriverUser } from '../../../common/user/models';
import { formatAuCurrency } from '../../../common/formatters/numeric';

import styles from '../dispatch.less';
import { BookingStatus } from '../../../choiceConstants';

function DispatchDetailLabel({ children, cols = { span: 6 } }) {
    return (
        <Col className={styles.detailSectionLabel} md={cols}>
            {children}
        </Col>
    );
}

DispatchDetailLabel.propTypes = {
    cols: PropTypes.object,
};

function DispatchDetailValue({ children, className, cols = { span: 17, offset: 1 } }) {
    return (
        <Col className={cx(styles.detailSectionValue, className)} md={cols}>
            {children}
        </Col>
    );
}

DispatchDetailValue.propTypes = {
    className: PropTypes.string,
    cols: PropTypes.object,
};

function DispatchDetailRow({ alignValueRight, label, value, labelCol, valueCol }) {
    return (
        <Row className={styles.detailSectionRow}>
            <DispatchDetailLabel cols={labelCol}>{label}</DispatchDetailLabel>
            <DispatchDetailValue
                cols={valueCol}
                className={cx(alignValueRight && styles.alignRight)}
            >
                {value}
            </DispatchDetailValue>
        </Row>
    );
}

DispatchDetailRow.propTypes = {
    alignValueRight: PropTypes.bool,
    label: PropTypes.node.isRequired,
    value: PropTypes.node,
    labelCol: PropTypes.object,
    valueCol: PropTypes.object,
};

function DispatchDetailSection({ header, children }) {
    return (
        <section className={styles.detailSection}>
            {header && <p className={styles.detailSectionHeader}>{header}</p>}
            {children}
        </section>
    );
}

DispatchDetailSection.propTypes = {
    header: PropTypes.string,
};

function DispatchDetailAdditionalStops({ additionalStops }) {
    let value = '';
    if (additionalStops.size > 0) {
        const content = (
            <ol className={styles.dispatchAdditionalStopList}>
                {additionalStops.map(stop => (
                    <li key={stop.id} className={styles.dispatchDetailAdditionalStop}>
                        {stop.address.formattedAddress}
                        {stop.address.addressInstructions && (
                            <div>{stop.address.addressInstructions}</div>
                        )}
                    </li>
                ))}
            </ol>
        );
        value = (
            <Popover placement="left" content={content}>
                <span>
                    <span className={styles.dispatchDetailAdditionalStopCount}>
                        +{additionalStops.size}
                    </span>
                    Additional Stop{additionalStops.size !== 1 && 's'}
                </span>
            </Popover>
        );
    }
    return <DispatchDetailRow label="Stops" value={value} />;
}

DispatchDetailAdditionalStops.propTypes = {
    additionalStops: PropTypes.object.isRequired,
};

function DispatchDriverSelectWidget(props) {
    const { fetching, items, ...rest } = props;
    return (
        <SelectWidget
            labelInValue
            showSearch
            filterOption={false}
            notFoundContent={fetching ? <Spin size="small" /> : <em>No results found</em>}
            onDropdownVisibleChange={open => !open && props.clearSearch()}
            placeholder="Choose Driver"
            {...rest}
        >
            <SelectWidget.Option key={'None'} value={null}>
                Choose Driver
            </SelectWidget.Option>
            {items.map(entity => (
                <SelectWidget.Option key={entity.id} value={entity.id}>
                    {entity.label}
                </SelectWidget.Option>
            ))}
        </SelectWidget>
    );
}

DispatchDriverSelectWidget.propTypes = {
    fetching: PropTypes.bool,
    items: PropTypes.arrayOf(PropTypes.object),
    clearSearch: PropTypes.func,
};

function DispatchPriceAdjustmentRow({
    disabled,
    fieldName,
    formActions,
    label,
    record,
    labelCol,
    valueCol,
}) {
    const adjustments = record.get(fieldName);
    const isOutOfPocket = fieldName === 'outOfPockets';
    const [modalVisible, setModalVisible] = useState(false);
    const rowLabel = `${label}${adjustments.size > 0 ? ` (${adjustments.size})` : ''}`;
    const adjustmentsTotal = adjustments.reduce(
        (subtotal, adjustment) => subtotal + Number(adjustment.amount),
        0
    );
    const addAdjustmentButton = (
        <Button
            className={styles.adjustmentAddButton}
            type="link"
            onClick={() => setModalVisible(true)}
        >
            Add
        </Button>
    );
    const rowValue = (
        <div className={styles.adjustmentValueRow}>
            {disabled ? <span /> : addAdjustmentButton}
            <span className={styles.adjustmentValueTotal}>
                {formatAuCurrency(adjustmentsTotal)}
            </span>
        </div>
    );

    const initialValues = {
        [fieldName]: adjustments.map(adjustment => adjustment.toObject()).toArray(),
    };

    const onSubmit = data => {
        // Because of the onChange on the form, this actually handles saving the changes on the server
        // validate handled the validations, so we're guaranteed to have valid data to send to the server
        formActions.change(fieldName, data[fieldName]);
        // Close the dialog
        setModalVisible(false);
    };

    const validateVariations = values => {
        // Trivially valid if there are no variations
        if (!values.priceVariations) {
            return {};
        }

        // Collect the errors
        const result = {};
        values.priceVariations.forEach((value, index) => {
            if (value) {
                const subResult = {};
                if (!value.variationType) {
                    subResult.variationType = 'Variation type is required';
                }
                if (!value.amount) {
                    subResult.amount = 'Amount is required';
                } else if (!Number(value.amount)) {
                    subResult.amount = 'Amount cannot be zero';
                }
                if (!isEmpty(subResult)) {
                    result[index] = subResult;
                }
            } else {
                result[index] = {
                    variationType: 'Variation type is required',
                    amount: 'Amount is required',
                };
            }
        });
        if (!result) {
            return {};
        }
        return { priceVariations: result };
    };
    const validateOutOfPockets = values => {
        // Trivially valid if there are no variations
        if (!values.outOfPockets) {
            return {};
        }

        // Collect the errors
        const result = {};
        values.outOfPockets.forEach((value, index) => {
            if (value) {
                const subResult = {};
                if (!value.description) {
                    subResult.description = 'Description is required';
                }
                if (!value.amount) {
                    subResult.amount = 'Amount is required';
                }
                if (!isEmpty(subResult)) {
                    result[index] = subResult;
                }
            } else {
                result[index] = {
                    description: 'Description is required',
                    amount: 'Amount is required',
                };
            }
        });
        if (!result) {
            return {};
        }
        return { outOfPockets: result };
    };
    const validate = isOutOfPocket ? validateOutOfPockets : validateVariations;

    return (
        <>
            <DispatchDetailRow
                label={rowLabel}
                value={rowValue}
                labelCol={labelCol}
                valueCol={valueCol}
            />
            <VariationOutOfPocketEntryModal
                initialValues={initialValues}
                isOutOfPocket={isOutOfPocket}
                onCancel={() => setModalVisible(false)}
                onSubmit={onSubmit}
                validate={validate}
                visible={modalVisible}
            />
        </>
    );
}

DispatchPriceAdjustmentRow.propTypes = {
    disabled: PropTypes.bool.isRequired,
    fieldName: PropTypes.string.isRequired,
    formActions: PropTypes.object.isRequired,
    label: PropTypes.string.isRequired,
    record: modelInstance('scbp_core.dispatch'),
    labelCol: PropTypes.object,
    valueCol: PropTypes.object,
};

const driverFormFieldNames = [
    'bookingStatus',
    'driver',
    'driverNotes',
    'dropoffTime',
    'isTimeTba',
    'officeNotes',
    'adminGeneralNotes',
    'pickupTime',
    'travelOn',
];

function DispatchDetailForm({ onComplete, record, sendToDriverVisible, setSendToDriverVisible }) {
    // Form handling
    const formName = 'dispatchDetailForm';
    const formActions = useFormActions(formName);
    const { driver: currentFormDriver, pickupTime, dropoffTime, travelOn } = useFormValues(
        formName,
        ['travelOn', 'dropoffTime', 'pickupTime', 'driver']
    );

    const onChange = (values, dispatch, props, previousValues) => {
        // Figure out if we have a genuine change
        const expectedKeys = driverFormFieldNames;
        const expectedRelationKeys = ['outOfPockets', 'priceVariations'];
        const difference = reduce(
            expectedKeys.concat(expectedRelationKeys),
            (result, key) => {
                let isValidDifference = expectedRelationKeys.includes(key)
                    ? !isEqual(
                          (previousValues[key] || []).map(variation =>
                              omit(variation, 'modelUUID')
                          ),
                          (values[key] || []).map(variation => omit(variation, 'modelUUID'))
                      )
                    : !isEqual(previousValues[key], values[key]);
                const prev = previousValues[key];
                const next = values[key];
                if (
                    ['dropoffTime', 'pickupTime'].includes(key) &&
                    isValidDifference &&
                    moment.isMoment(prev) &&
                    moment.isMoment(next) &&
                    prev.format('HHmm') === next.format('HHmm')
                ) {
                    isValidDifference = false;
                }
                if (isValidDifference) {
                    result[key] = { old: previousValues[key], new: values[key] };
                }
                return result;
            },
            {}
        );
        // If we have values to submit and a genuine change, submit form
        // 'values' checks for values to submit
        // 'previousValues' check prevents submit on form initialization
        // 'differences' check prevents submit without a genuine change
        if (!isEmpty(values) && !isEmpty(previousValues) && !isEmpty(difference)) {
            const thisPickupTime = moment(values.pickupTime);
            const thisDropoffTime = moment(values.dropoffTime);
            if (thisPickupTime && thisDropoffTime) {
                if (thisDropoffTime.isBefore(thisPickupTime)) {
                    const daysToAdd = thisPickupTime.diff(thisDropoffTime, 'days') + 1;
                    values.dropoffTime = thisDropoffTime.add(daysToAdd, 'days');
                } else if (thisPickupTime.isBefore(thisDropoffTime.subtract(1, 'day'))) {
                    const daysToSubtract = thisDropoffTime.diff(thisPickupTime, 'days');
                    values.dropoffTime = thisDropoffTime.subtract(daysToSubtract, 'days');
                }
            }
            formActions.submit(values, dispatch, props);
        }

        if (onComplete && record.bookingStatus === BookingStatus.COMPLETED.value) {
            formActions.startSubmit();
            onComplete();
        }
    };

    const { formProps } = useModelFormProcessor({
        model: DispatchBooking,
        record,
        onSuccess: () => {},
    });

    // Detect whether the form is submitting - needed to disable time fields and variation add button
    const isDispatchSubmitting = useSelector(isSubmitting(formName));

    // Travel time computation
    const travelTime = () => {
        if (!pickupTime || !dropoffTime) {
            return '-';
        }
        const travelOnTime = moment(travelOn);
        let thisDropoffTime = moment(dropoffTime);
        let thisPickupTime = moment(pickupTime);
        let offsetDays = 0;
        const today = moment();

        if (travelOnTime.isAfter(today)) {
            offsetDays = travelOnTime.diff(today.startOf('day'), 'days');
        } else if (travelOnTime.isBefore(today)) {
            offsetDays = travelOnTime.diff(today.endOf('day'), 'days');
        }

        thisPickupTime = moment(thisPickupTime).add(offsetDays, 'days');
        thisDropoffTime = moment(thisDropoffTime).add(offsetDays, 'days');

        const greaterStartTime =
            thisDropoffTime.diff(travelOnTime.startOf('minute'), 'minutes') >
            thisDropoffTime.diff(thisPickupTime.startOf('minute'), 'minutes')
                ? travelOnTime
                : thisPickupTime;

        const hours = thisDropoffTime.diff(greaterStartTime, 'hours');
        const minutes = thisDropoffTime.diff(greaterStartTime, 'minutes') % 60;

        return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    };

    const isManagedInLegacy = record.isManagedInLegacy;
    let breakdown;
    try {
        // Some bookings imported aren't valid - handle it here
        breakdown = isManagedInLegacy
            ? new LegacyBookingPriceBreakdown(record.legacyPriceBreakdown)
            : new BookingPriceBreakdown(record.priceBreakdown);
    } catch (e) {
        // eslint-disable-next-line
        console.error('Failed to create breakdown', e);
    }

    return (
        <>
            <ScbpModelForm
                enableReinitialize
                footer={null}
                // Only initialise with fields we explicitly include in this form. This avoids submitting
                // potentially old data and issues with passing through conflicting fields (eg. driver_number
                // and driver).
                initialValues={{
                    ...pick(record, driverFormFieldNames),
                    priceVariations: record.priceVariations
                        .toArray()
                        .map(v =>
                            pick(v, [
                                'id',
                                'variationType',
                                'variationTypeOtherDescription',
                                'amount',
                            ])
                        ),
                    outOfPockets: record.outOfPockets
                        .toArray()
                        .map(v => pick(v, ['id', 'description', 'amount'])),
                }}
                name={formName}
                onChange={onChange}
                record={record}
                {...formProps}
            >
                <span className={cx(styles.bookingDetailNumber, styles[record.dispatchCategory])}>
                    {record.bookingNumber}
                </span>
                <ActionLink
                    action="update"
                    className={styles.bookingLink}
                    model={Booking}
                    params={{ id: record.id }}
                    target="_blank"
                >
                    View Booking
                </ActionLink>
                <ResendEmailButton
                    className={styles.confirmationLink}
                    record={record}
                    title="Send Confirmation Email"
                    endpoint="send-confirmation-email"
                >
                    Send Confirmation
                </ResendEmailButton>
                <DispatchDetailSection>
                    <DispatchDetailRow
                        label="Date"
                        value={<DateFormatter value={record.travelOn} format="ddd MMMM Do YYYY" />}
                    />
                    <DispatchDetailRow label="Client" value={record.clientUserFullname} />
                    <DispatchDetailRow
                        label="A/C"
                        value={
                            <div>
                                {record.account__relatedNumber}
                                <br />
                                {record.account__relatedLabel}
                            </div>
                        }
                    />
                    <DispatchDetailRow
                        label="Pax"
                        value={`${record.passengerName} - ${record.passengerPhone ||
                            record.clientPhoneNumber}`}
                    />
                    <DispatchDetailRow
                        label="P/U"
                        value={
                            <div>
                                <FromAddressFormatter booking={record} />
                            </div>
                        }
                    />
                    <DispatchDetailRow
                        label="P/U Inst"
                        value={record.fromAddress.addressInstructions}
                    />
                    {record.additionalStopCount > 0 && (
                        <DispatchDetailAdditionalStops
                            additionalStops={record.bookingAdditionalStops}
                        />
                    )}
                    <DispatchDetailRow
                        label="To"
                        value={
                            record.destinationAddress ? (
                                <div>
                                    <DestinationAddressFormatter booking={record} />
                                </div>
                            ) : (
                                <>
                                    {record.additionalStopCount > 0 &&
                                        record.bookingAdditionalStops
                                            .filter(
                                                (stop, i) =>
                                                    record.bookingAdditionalStops.size - 1 === i
                                            )
                                            .map((stop, i) => (
                                                <div key={`${stop.id}-${i}`}>
                                                    {stop.address.formattedAddress}
                                                    {stop.address.addressInstructions && (
                                                        <div>
                                                            {stop.address.addressInstructions}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                </>
                            )
                        }
                    />
                    {record.destinationAddress && (
                        <DispatchDetailRow
                            label="Dest Inst"
                            value={record.destinationAddress.addressInstructions}
                        />
                    )}
                    {record.hourlyBookingDuration && (
                        <DispatchDetailRow label="Duration" value={record.hourlyBookingDuration} />
                    )}
                    {record.car && <DispatchDetailRow label="Car Type" value={record.car} />}
                    <DispatchDetailRow label="Requests" value={record.options || 'None'} />
                    <DispatchDetailRow
                        label="Driver Inst"
                        value={
                            <ScbpModelForm.Item
                                fullWidth
                                label={false}
                                name="driverNotes"
                                widget={DispatchInstructionWidget}
                            />
                        }
                    />
                    <DispatchDetailRow
                        label="Office Inst"
                        value={
                            <ScbpModelForm.Item
                                fullWidth
                                label={false}
                                name="officeNotes"
                                widget={DispatchInstructionWidget}
                            />
                        }
                    />
                    <DispatchDetailRow
                        label="Driver"
                        value={
                            <ScbpModelForm.Item fullWidth label={false} name="driver">
                                <ScbpModelForm.Field
                                    name="driver"
                                    widget={ModelLookupWidget}
                                    widgetProps={{
                                        model: DriverUser,
                                        labelFieldName: 'dispatchLabel',
                                        baseFilter: { isActive: true },
                                        allowClear: true,
                                        lookupWidget: DispatchDriverSelectWidget,
                                    }}
                                />
                                <Button
                                    disabled={!record.driver}
                                    onClick={() => setSendToDriverVisible(true)}
                                    type="primary"
                                >
                                    Send Job to Driver
                                </Button>
                            </ScbpModelForm.Item>
                        }
                    />
                    <DispatchDetailRow
                        label="Status"
                        value={
                            <ScbpModelForm.Item fullWidth label={false} name="bookingStatus">
                                <ScbpModelForm.Field
                                    name="bookingStatus"
                                    widget={DispatchBookingStatusWidget}
                                    onComplete={onComplete}
                                />
                            </ScbpModelForm.Item>
                        }
                    />
                </DispatchDetailSection>
                <DispatchDetailSection>
                    <table className={styles.dispatchDetailTimeSection}>
                        <tbody>
                            <tr>
                                <td className={styles.detailSectionLabel}>Time</td>
                                <td>
                                    <div className={styles.detailTimeWrapper}>
                                        <ScbpModelForm.Item label={false} name="travelOn">
                                            <DispatchTimeField
                                                disabled={isDispatchSubmitting}
                                                name="travelOn"
                                                required
                                            />
                                        </ScbpModelForm.Item>
                                    </div>
                                </td>
                                <td className={styles.detailSectionLabel}>
                                    Var ({record.priceVariations.size})
                                </td>
                                <td>
                                    <DispatchPriceAdjustmentRow
                                        disabled={isDispatchSubmitting}
                                        fieldName="priceVariations"
                                        formActions={formActions}
                                        label=""
                                        record={record}
                                        labelCol={{ span: 0 }}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className={styles.detailSectionLabel}>P/U</td>
                                <td>
                                    <div className={styles.detailTimeWrapper}>
                                        <ScbpModelForm.Item label={false} name="pickupTime">
                                            <DispatchTimeField
                                                disabled={isDispatchSubmitting}
                                                name="pickupTime"
                                            />
                                        </ScbpModelForm.Item>
                                    </div>
                                </td>
                                <td className={styles.detailSectionLabel}>
                                    OOP ({record.outOfPockets.size})
                                </td>
                                <td>
                                    <DispatchPriceAdjustmentRow
                                        disabled={isDispatchSubmitting}
                                        fieldName="outOfPockets"
                                        formActions={formActions}
                                        label=""
                                        record={record}
                                        labelCol={{ span: 0 }}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className={styles.detailSectionLabel}>Drop</td>
                                <td>
                                    <div className={styles.detailTimeWrapper}>
                                        <ScbpModelForm.Item label={false} name="dropoffTime">
                                            <DispatchTimeField
                                                disabled={isDispatchSubmitting}
                                                name="dropoffTime"
                                            />
                                        </ScbpModelForm.Item>
                                    </div>
                                </td>
                                <td className={styles.detailSectionLabel}>Bkg Val</td>
                                <td>
                                    <DispatchDetailRow
                                        alignValueRight
                                        label=""
                                        value={formatAuCurrency(record.priceTotal)}
                                        labelCol={{ span: 0 }}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className={styles.detailSectionLabel}>Total</td>
                                <td>
                                    <div className={styles.detailTimeWrapper}>
                                        <Input
                                            disabled
                                            value={travelTime()}
                                            className={styles.totalTimeInput}
                                        />
                                    </div>
                                </td>
                                <td className={styles.detailSectionLabel}>Drv Value</td>
                                <td>
                                    <DispatchDetailRow
                                        alignValueRight
                                        label=""
                                        value={formatAuCurrency(record.bookingValue)}
                                        labelCol={{ span: 0 }}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </DispatchDetailSection>
                <DispatchDetailSection>
                    <DispatchDetailRow
                        label="General Notes"
                        value={
                            <ScbpModelForm.Item
                                fullWidth
                                label={false}
                                name="adminGeneralNotes"
                                widget={DispatchInstructionWidget}
                            />
                        }
                    />
                    {breakdown && isManagedInLegacy && (
                        <BookingPricingLegacySummary breakdown={breakdown} />
                    )}
                    {breakdown && !isManagedInLegacy && (
                        <PriceBreakdownTable breakdown={breakdown} />
                    )}
                    {!breakdown && (
                        <Alert
                            type="warning"
                            message="Cannot show breakdown - check booking has valid price calculated (is the address valid?)"
                        />
                    )}
                </DispatchDetailSection>

                {// Only show modal once selected form value for driver matches driver saved
                // on record. This avoids mismatch where new driver selected but hasn't
                // saved yet so modal initially shows for previous driver then closes
                // and re-opens for updated driver
                record.driver && Number(currentFormDriver) === record.driver && (
                    <DispatchSendToDriverModal
                        booking={record}
                        onCancel={() => setSendToDriverVisible(false)}
                        visible={sendToDriverVisible}
                    />
                )}
            </ScbpModelForm>
        </>
    );
}

DispatchDetailForm.propTypes = {
    onComplete: PropTypes.func,
    record: modelInstance('scbp_core.dispatch'),
    sendToDriverVisible: PropTypes.bool,
    setSendToDriverVisible: PropTypes.func,
};

export default function DispatchDetailPanel({ lastRefresh, recordId, ...rest }) {
    const { record, isLoading, error, run } = useGetModel(DispatchBooking, recordId, {
        trigger: useGetModel.MANUAL,
    });

    useEffect(() => {
        run();
    }, [lastRefresh, recordId, run]);

    if (error && recordId) {
        throw error;
    }

    return (
        <div className={styles.bookingDetails}>
            <>
                {isLoading && !record && <Spin size="large" />}
                {record && <DispatchDetailForm record={record} {...rest} />}
            </>
        </div>
    );
}

DispatchDetailPanel.propTypes = {
    // Used to invalidate cache
    lastRefresh: PropTypes.string.isRequired,
    // ID of booking to display in panel
    recordId: PropTypes.number.isRequired,
};
