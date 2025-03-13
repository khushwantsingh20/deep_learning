import { modelDetailRoute } from '@alliance-software/djrad/actions';
import Breadcrumb from '@alliance-software/djrad/components/breadcrumbs/Breadcrumb';
import { handleErrorResponse } from '@alliance-software/djrad/components/form';
import Form from '@alliance-software/djrad/components/form/Form';
import RelatedModelLookupWidget from '@alliance-software/djrad/components/form/widgets/RelatedModelLookupWidget';
import SwitchWidget from '@alliance-software/djrad/components/form/widgets/SwitchWidget';
import TextAreaWidget from '@alliance-software/djrad/components/form/widgets/TextAreaWidget';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import FieldFormatter from '@alliance-software/djrad/components/model/FieldFormatter';
import FieldFormatterProvider from '@alliance-software/djrad/components/model/FieldFormatterProvider';
import FieldWidgetProvider from '@alliance-software/djrad/components/model/FieldWidgetProvider';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import BooleanField from '@alliance-software/djrad/model/fields/BooleanField';
import CharField from '@alliance-software/djrad/model/fields/CharField';
import TextField from '@alliance-software/djrad/model/fields/TextField';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { Button, Col, message, Modal, Popconfirm, Row } from 'antd';
import debounce from 'lodash/debounce';
import pick from 'lodash/pick';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'react-redux';
import { getFormValues } from 'redux-form';
import {
    AirportTerminalValueMap,
    BookingAddressType,
    BookingPaymentMethod,
    BookingStatus,
    BookingType,
    BookingDriverCollectMethod,
    bookingDriverCollectMethodChoices,
    PaymentMethodType,
} from '../../../choiceConstants';
import api from '../../../common/api';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import BooleanSelectWidget from '../../../common/form/BooleanSelectWidget';
import { formatAuCurrency } from '../../../common/formatters/numeric';
import { BookingPriceBreakdown, LegacyBookingPriceBreakdown } from '../../../common/records';
import { Account } from '../../../common/user/models';
import AdminPageHeader from '../../components/AdminPageHeader';
import { ClientUser } from '../../user/models';
import { VehicleClass } from '../../vehicle/models';
import { AdminBookingContext } from '../adminBookingContext';
import BookingClientAccountEntryPanel from '../components/BookingClientAccountEntryPanel';
import BookingDetailsEntryPanel from '../components/BookingDetailsEntryPanel';
import BookingPanel from '../components/BookingEntryPanel';
import BookingLog from '../components/BookingLogModal';
import BookingOptionalExtrasPanel from '../components/BookingOptionalExtrasPanel';
import BookingPricingLegacySummary from '../components/BookingPricingLegacySummary';
import BookingPricingSidePanel from '../components/BookingPricingSidePanel';
import BookingSaveButton from '../components/BookingSaveButton';
import BookingTripRoutePanel from '../components/BookingTripRoutePanel';
import BookingValueWidget from '../components/BookingValueWidget';
import { Booking } from '../models';

import styles from './BookingCreateUpdateView.less';
import useKeyPress from '../../dispatch/hooks/useKeyPress';

const { Item } = ScbpModelForm;
const FormButton = ScbpModelForm.Button;

const DRIVER_SELECT_HINT = '** Select method **';

function declineBookingAction(record) {
    return modelDetailRoute('post', record, 'decline-booking');
}

function cancelBookingAction(record, data) {
    return modelDetailRoute('post', record, 'cancel-booking', data);
}

function reinstateBookingAction(record) {
    return modelDetailRoute('post', record, 'reinstate-booking');
}

function missingPriceEstimateFields(values) {
    const requiredFields = [
        'travelOnDate',
        'travelOnTime',
        'fromAddress',
        'passengerCount',
        'vehicleClass',
        'clientUser',
    ];
    if (!values) {
        return requiredFields;
    }
    if (values.bookingType === BookingType.ONE_WAY.value) {
        requiredFields.push('destinationAddress');
    } else if (values.bookingType === BookingType.HOURLY.value) {
        requiredFields.push('hourlyBookingDuration');
        requiredFields.push('bookingAdditionalStops');
    } else {
        requiredFields.push('bookingType');
    }
    return requiredFields.filter(fieldName => {
        const value = values[fieldName];
        if (fieldName === 'bookingAdditionalStops') {
            if (!value || value.length === 0 || !value[0]) {
                return true;
            }
            return !value[0].isValidAddress;
        }
        return fieldName.match(/Address/) ? !value || value.isValidAddress === false : !value;
    });
}

function hasRequiredValuesForPriceEstimate(values) {
    return missingPriceEstimateFields(values).length === 0;
}

function formatTravelOnTimeForSubmission(value) {
    const parseResult = moment(value, ['HHmm', 'Hmm'], true);
    if (parseResult.isValid()) {
        return parseResult.format('HH:mm');
    }
    return value;
}

/**
 * Transform data into format expected by backend
 */
function transformData(data, submitAction) {
    const transformedData = {
        ...data,
        travelOnTime: formatTravelOnTimeForSubmission(data.travelOnTime),
        ...(!data.bookingAdditionalStops
            ? {}
            : {
                  bookingAdditionalStops: data.bookingAdditionalStops.map((e, idx) => ({
                      address: e,
                      stopNumber: idx + 1,
                      isPickUp: e ? e.isPickUp : false,
                  })),
              }),
        ...([BookingStatus.UNVERIFIED.value, BookingStatus.CHANGED.value].includes(
            data.bookingStatus
        )
            ? {
                  requestConfirmationEmail: true,
              }
            : {}),
    };

    if (transformedData.passenger === 'guest') {
        delete transformedData.passenger;
    }
    if (transformedData.fromAddressType !== BookingAddressType.AIRPORT.value) {
        [
            'fromFlightNumber',
            'fromAirportArrivalAfterLanding',
            'fromAirportDriverRequiredOnLanding',
        ].forEach(key => {
            delete transformedData[key];
        });
    }
    if (submitAction === 'PREPAY') {
        transformedData.prepay = true;
    }
    if (transformedData.driverCollectMethod === DRIVER_SELECT_HINT) {
        // The backend will validate this field to ensure it is provided as one of the valid enumeration values for the
        // field.  The DRIVER_SELECT_HINT value is not one of these, so transform it to something valid (but not valid
        // when the payment method is driver-collect - this ensures the custom backend validation can still trigger)
        transformedData.driverCollectMethod = 0;
    }
    return transformedData;
}

/**
 * Determine the widget to use. We override this so that we can set fields to read only
 * based on the status of booking
 */
function getWidgetForField(field, widgetProps, parentGetWidgetForField) {
    let defaultWidget = parentGetWidgetForField
        ? parentGetWidgetForField(field, widgetProps)
        : field.getDefaultWidget(widgetProps);
    if (field instanceof BooleanField) {
        // Display Boolean fields with select Yes / No rather than checkbox
        defaultWidget = BooleanSelectWidget;
    }
    return <BookingValueWidget {...widgetProps} widget={defaultWidget} />;
}

/**
 * When a booking field is read only (see getWidgetForField above and BookingValueWidget) then
 * it's formatter is used to render it. We override the default to display 'None' for text fields
 * when those fields contain no data - otherwise it uses default.
 */
function getFormatterForField(field, record, value, otherProps = {}, parentGetFormatterForField) {
    if ((field instanceof TextField || field instanceof CharField) && !value) {
        return <em>None</em>;
    }
    return parentGetFormatterForField(field, record, value, otherProps);
}

function TimeItem({ label, value }) {
    return (
        <>
            <div className={styles.timeItemLabel}>{label}:</div>
            {value || <em>N/A</em>}
        </>
    );
}

TimeItem.propTypes = {
    label: PropTypes.node.isRequired,
    value: PropTypes.node,
};

function TimeSection({ booking }) {
    // Using ~~ to cast the division results to integer
    // (~ is the bitwise not operator which JS only allows for integers,
    // forcing the cast we want)
    const numHours = ~~(booking.totalTimeSpent / 3600);
    const numMinutes = ~~((booking.totalTimeSpent % 3600) / 60);
    // undefined % x is falsy NaN for all x, and NaN + NaN is NaN
    // If totalTimeSpent is less than 60, then numHours and numMinutes will both be 0
    const dispTimeSpent =
        numHours + numMinutes
            ? `${numHours}:${numMinutes < 10 ? '0' + numMinutes : numMinutes}`
            : 'N/A';
    return (
        <div className={styles.timeSummary}>
            <Row gutter={30}>
                <Col span={6}>
                    <h3>Time</h3>
                </Col>
                <Col span={17}>
                    <TimeItem
                        label="Booking"
                        value={booking.travelOn && moment(booking.travelOn).format('HH:mm')}
                    />
                    <TimeItem
                        label="Pick up"
                        value={
                            booking.pickupTime ? moment(booking.pickupTime).format('HH:mm') : 'N/A'
                        }
                    />
                    <TimeItem
                        label="Drop Off"
                        value={
                            booking.dropoffTime
                                ? moment(booking.dropoffTime).format('HH:mm')
                                : 'N/A'
                        }
                    />
                    <TimeItem label="Total" value={dispTimeSpent} />
                    <TimeItem label="KMs" value={booking.totalDistance} />
                </Col>
            </Row>
        </div>
    );
}
TimeSection.propTypes = {
    booking: modelInstance('scbp_core.booking').isRequired,
};

function useScriptComponents(values, priceBreakdown) {
    const { record: vehicleClass } = useGetModel(VehicleClass, values.vehicleClass, {});
    const { record: accountRecord } = useGetModel(Account, values.account, {});

    const clientIds = values
        ? [values.clientUser, !values.passengerGuest && values.passenger].filter(id => id)
        : [];
    const { records, isLoading } = useListModel(ClientUser, {
        id: clientIds,
    });
    let client;
    let passenger = values.passengerName;
    // TODO: There appears to be an issue with useListModel where it may not set loading
    // state immediately after filters change. Without this we may not have the data
    // necessary to continue. Workaround this by only continuing once client is found.
    // Refactor this after djrad upgrade (we can then use `useGetModel` which is nicer
    // anyway with conditional fetch on passenger which may not be set)
    if (values && records) {
        client = records.filter(record => record.id === Number(values.clientUser)).first();
        if (!values.passengerGuest) {
            passenger = records.filter(record => record.id === Number(values.passenger)).first();
        }
    }
    if (!client || !passenger || !vehicleClass || isLoading || !accountRecord) {
        return [];
    }

    // Fetch client and passenger information
    const clientName = client.name;
    const passengerName = values.passengerGuest ? values.passengerName : passenger.name;

    const [hour, minutes] = formatTravelOnTimeForSubmission(values.travelOnTime).split(':');
    // Generate the script components
    const travelTimeScript = (
        <>
            <div className={styles.scriptRow}>
                <div className={styles.scriptLabel}>Day:</div>
                <div>{moment(values.travelOnDate).format('dddd')}</div>
            </div>
            <div className={styles.scriptRow}>
                <div className={styles.scriptLabel}>Date:</div>
                <div>{moment(values.travelOnDate).format('Do MMMM YYYY')}</div>
            </div>
            <div className={styles.scriptRow}>
                <span className={styles.scriptLabel}>Time:</span>
                <div>
                    {moment(values.travelOnDate)
                        .set('hour', hour)
                        .set('minute', minutes)
                        .format(' LT')}
                </div>
            </div>
        </>
    );
    const numChildren =
        values.forwardFacingBabySeatCount +
        values.rearFacingBabySeatCount +
        values.boosterSeatCount;

    const displayPaymentType = (bookingPaymentMethod, driverCollectMethod) => {
        if (bookingPaymentMethod === BookingPaymentMethod.CREDIT_CARD.value) {
            return (
                <>
                    AUTO - Credit Card ({accountRecord.creditCard.cardType} ...
                    {accountRecord.creditCard.last4} exp {accountRecord.creditCardExpiryMonth}/
                    {accountRecord.creditCardExpiryYear})
                </>
            );
        } else if (bookingPaymentMethod === BookingPaymentMethod.INVOICE.value) {
            return 'AUTO - Invoice';
        }
        if (driverCollectMethod === BookingDriverCollectMethod.CABCHARGE.value) {
            return 'Driver - Cabcharge';
        } else if (driverCollectMethod === BookingDriverCollectMethod.CAB_CARD.value) {
            return 'Driver - Credit Card';
        } else if (driverCollectMethod === BookingDriverCollectMethod.CAB_CASH.value) {
            return 'Driver - Cash';
        }
        return 'Unknown';
    };

    const clientScript = (
        <>
            <div className={styles.scriptRow}>
                <span className={styles.scriptLabel}>Bill to:</span>
                <div>{clientName}</div>
            </div>
            <div className={styles.scriptRow}>
                <span className={styles.scriptLabel}>Payment Method:</span>
                <div>
                    {displayPaymentType(values.bookingPaymentMethod, values.driverCollectMethod)}
                </div>
            </div>
            <div className={styles.scriptRow}>
                <span className={styles.scriptLabel}>Pax:</span>
                <div>
                    <strong>{passengerName}</strong>
                </div>
            </div>
            <div className={styles.scriptRow}>
                <span className={styles.scriptLabel}>No of Pax:</span>
                <div>
                    {values.passengerCount === 1 ? (
                        <>1 pax &ndash;&nbsp;</>
                    ) : (
                        <>{values.passengerCount} pax &ndash;&nbsp;</>
                    )}
                    {numChildren === 1 ? '1 child.' : `${numChildren || 0} children.`}
                </div>
            </div>
            {vehicleClass && vehicleClass.isAnyClass === false && (
                <div className={styles.scriptRow}>
                    <span className={styles.scriptLabel}>Class:</span>
                    <div>{vehicleClass.title}</div>
                </div>
            )}
        </>
    );

    const fromAddressScript =
        values.fromAddressType === BookingAddressType.AIRPORT.value ? (
            <div className={styles.scriptRow}>
                <span className={styles.scriptLabel}>Pick Up:</span>
                <div>
                    <div>
                        MAP &ndash; <strong>{values.fromFlightNumber}</strong>
                    </div>
                    <div>
                        driver will arrive{' '}
                        {values.fromAirportDriverRequiredOnLanding ? (
                            'on'
                        ) : (
                            <strong>{values.fromAirportArrivalAfterLanding} minutes after</strong>
                        )}{' '}
                        landing
                    </div>
                </div>
            </div>
        ) : (
            <div className={styles.scriptRow}>
                <span className={styles.scriptLabel}>Pick Up:</span>
                <div>
                    <div>
                        <strong>{values.fromAddress.placeName}</strong>
                    </div>
                    {values.fromAddress.formattedAddress}
                    <div>{values.fromAddress.addressInstructions}</div>
                </div>
            </div>
        );
    const additionalStopScriptComponents = values.bookingAdditionalStops ? (
        <div className={styles.scriptRow}>
            <span className={styles.scriptLabel}>Via:</span>
            <div>
                <ol>
                    {values.bookingAdditionalStops.map(stop => (
                        <li key={stop}>
                            {stop.placeName} {stop.formattedAddress}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    ) : (
        ''
    );

    const destinationAddressScript = values.destinationAddress ? (
        <div className={styles.scriptRow}>
            <span className={styles.scriptLabel}>Destination:</span>
            <div>
                <strong>
                    {values.destinationAddressType === BookingAddressType.AIRPORT
                        ? values.destinationAddress.placeName
                        : ''}{' '}
                    {values.destinationAddress.formattedAddress}
                </strong>
                {values.destinationAddressType === BookingAddressType.AIRPORT.value && (
                    <div>
                        <strong>{values.destinationFlightDepartureTime}</strong> departure at{' '}
                        <strong>
                            {AirportTerminalValueMap[values.destinationAirportTerminal].label}
                        </strong>
                    </div>
                )}
                <div>{values.destinationAddress.addressInstructions}</div>
            </div>
        </div>
    ) : (
        <div className={styles.scriptRow}>
            <span className={styles.scriptLabel}>Destination:</span>
            <div>
                {values.bookingAdditionalStops.length > 0 &&
                    values.bookingAdditionalStops
                        .filter((stop, i) => values.bookingAdditionalStops.length - 1 === i)
                        .map((stop, i) => (
                            <div key={`${stop}-${i}`}>
                                {stop.placeName} {stop.formattedAddress}
                            </div>
                        ))}
            </div>
        </div>
    );

    const optionScript = values.requiresWeddingRibbons ? (
        <div className={styles.scriptRow}>
            <span className={styles.scriptLabel}>Options:</span>
            <div>{values.requiresWeddingRibbons && 'ribbons'}</div>
        </div>
    ) : (
        ''
    );
    const driverInstructionsScript = values.driverNotes ? (
        <div className={styles.scriptRow}>
            <span className={styles.scriptLabel}>Driver to be advised:</span>
            <div>{values.driverNotes}</div>
        </div>
    ) : (
        ''
    );
    const costScript = (
        <>
            {values.hourlyBookingDuration && (
                <div className={styles.scriptRow}>
                    <span className={styles.scriptLabel}>Total Estimated Time:</span>
                    <div>{moment(values.hourlyBookingDuration, 'h:mm').format('h:mm')} hours</div>
                </div>
            )}
            <div className={styles.scriptRow}>
                <span className={styles.scriptLabel}>Total Cost:</span>
                <div>{formatAuCurrency(priceBreakdown ? priceBreakdown.total : 0)}</div>
            </div>
        </>
    );

    // Assemble the script components
    return [
        travelTimeScript,
        clientScript,
        fromAddressScript,
        additionalStopScriptComponents,
        destinationAddressScript,
        optionScript,
        driverInstructionsScript,
        costScript,
    ].filter(component => !!component);
}

function ConfirmCreateModal({ bookReturn, closeModal, priceBreakdown, requestFormValues, submit }) {
    const values = requestFormValues();

    // Script to be read
    const scriptComponents = useScriptComponents(values, priceBreakdown);

    // Button handlers
    const closeSubmit = () => {
        submit();
        closeModal();
    };
    const closeReturn = () => {
        bookReturn();
        closeModal();
    };

    // 3 buttons in the modal at present - Cancel, Proceed, Return
    const buttonOptions = [
        {
            name: 'cancel',
            label: 'Cancel',
            key: 'back',
            type: 'danger',
            onClick: closeModal,
            ref: useRef(null),
        },
        {
            name: 'proceed',
            label: 'Proceed',
            key: 'submit',
            type: 'primary',
            onClick: closeSubmit,
            ref: useRef(null),
            isInitiallySelected: true,
        },
        {
            name: 'return',
            label: 'Return',
            key: 'submitAndReturn',
            type: 'success',
            onClick: closeReturn,
            ref: useRef(null),
        },
    ];

    // Initial focus on Proceed button
    const initialButtonIndex = buttonOptions.findIndex(button => button.isInitiallySelected);
    const [focusedButton, setFocusedButton] = useState(buttonOptions[initialButtonIndex]);

    if (focusedButton.ref.current) {
        focusedButton.ref.current.buttonNode.focus();
    }

    useKeyPress('ArrowLeft', () => {
        setFocusedButton(prevButton => {
            const prevButtonIndex = buttonOptions.findIndex(
                button => button.name === prevButton.name
            );
            return buttonOptions[
                (prevButtonIndex + buttonOptions.length - 1) % buttonOptions.length
            ];
        });
    });

    useKeyPress('ArrowRight', () => {
        setFocusedButton(prevButton => {
            const prevButtonIndex = buttonOptions.findIndex(
                button => button.name === prevButton.name
            );
            return buttonOptions[(prevButtonIndex + 1) % buttonOptions.length];
        });
    });

    const footer = buttonOptions.map(option => {
        return (
            <Button key={option.key} type={option.type} onClick={option.onClick} ref={option.ref}>
                {option.label}
            </Button>
        );
    });

    if (!values) {
        return <></>;
    }

    return (
        <Modal
            closable={false}
            destroyOnClose
            footer={footer}
            onCancel={closeModal}
            title="Booking confirmation"
            visible={!!values}
            className={styles.scriptModal}
        >
            <div className={styles.scriptOutput}>
                {scriptComponents.map((component, i) => (
                    <div key={i}>{component}</div>
                ))}
            </div>
        </Modal>
    );
}

ConfirmCreateModal.propTypes = {
    bookReturn: PropTypes.func.isRequired,
    closeModal: PropTypes.func.isRequired,
    priceBreakdown: PropTypes.object,
    requestFormValues: PropTypes.func.isRequired,
    submit: PropTypes.func.isRequired,
};

function CancelBookingModal({ closeModal, submit, visible }) {
    const formName = 'cancellationNotes';
    const formActions = useFormActions(formName);
    const { notes } = useFormValues(formName, ['notes']);

    const onOk = () => {
        formActions.submit();
    };

    const onSubmit = () => {
        submit(notes);
        closeModal();
    };

    const footer = [
        <Button type="primary" key="submit" onClick={onOk}>
            Proceed
        </Button>,
    ];

    const validate = data => {
        const errors = {};
        if (!data.notes || data.notes.length <= 1) {
            errors.notes = 'You must provide a reason for cancelling this booking';
        }
        return errors;
    };

    return (
        <Modal
            closable={false}
            footer={footer}
            destroyOnClose
            title="Enter reason for cancellation"
            visible={visible}
        >
            <Form validate={validate} name={formName} onSubmit={() => onSubmit()}>
                <Form.Item label="Cancellation notes">
                    <Form.Field name="notes" widget={TextAreaWidget} />
                </Form.Item>
            </Form>
        </Modal>
    );
}

CancelBookingModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    submit: PropTypes.func.isRequired,
};

export default function BookingCreateUpdateView({ record, history, match }) {
    const formName = 'BookBookingBook';
    const formActions = useFormActions(formName);

    const {
        vehicleClass,
        bookingType,
        clientUser,
        account,
        passenger,
        requestConfirmationEmail,
        bookingPaymentMethod,
        driverCollectMethod,
    } = useFormValues(formName, [
        'vehicleClass',
        'bookingType',
        'clientUser',
        'account',
        'passenger',
        'requestConfirmationEmail',
        'bookingPaymentMethod',
        'driverCollectMethod',
    ]);

    useGetModel(ClientUser, clientUser, {
        partialRecordFieldNames: ['driverInstructions', 'internalInstructions'],
        onSuccess(r) {
            if (r.internalInstructions) {
                formActions.change('officeNotes', r.internalInstructions);
            }
            if (r.driverInstructions) {
                formActions.change('driverNotes', r.driverInstructions);
            }
        },
    });
    const { record: accountRecord } = useGetModel(Account, account, {});

    const [priceBreakdown, setPriceBreakdown] = useState(null);
    const [missingPriceFields, setMissingPriceFields] = useState([]);
    const [requestingPrice, setRequestingPrice] = useState(false);
    const [showConfirmCreateModal, setShowConfirmCreateModal] = useState(false);
    const [showCancelBookingModal, setShowCancelBookingModal] = useState(false);
    const [bookingReturnNumber, setBookingReturnNumber] = useState(null);
    const store = useStore();
    const requestPrice = useCallback(
        (valueOverrides = {}) => {
            if (record && record.isManagedInLegacy) {
                return Promise.resolve();
            }
            const values = getFormValues(formName)(store.getState());
            if (!hasRequiredValuesForPriceEstimate(values)) {
                const missingFields = missingPriceEstimateFields(values);
                setMissingPriceFields(missingFields);
                return Promise.resolve();
            }
            setMissingPriceFields([]);
            setRequestingPrice(true);
            let promise;
            const transformedData = transformData({ ...values, ...valueOverrides });
            if (record) {
                promise = api.detailRoutePost(record, 'estimate-price', transformedData);
            } else {
                promise = api.listRoutePost(Booking, 'estimate-price', transformedData);
            }
            return promise
                .then(r => {
                    formActions.setSubmitSucceeded();
                    formActions.clearSubmitErrors();
                    formActions.clearAsyncError();
                    setPriceBreakdown(new BookingPriceBreakdown(r.breakdown));
                })
                .catch(e => {
                    try {
                        handleErrorResponse(e);
                    } catch (submissionError) {
                        const fieldsToTouch = Object.keys(submissionError.errors);
                        if ('bookingAdditionalStops' in submissionError.errors) {
                            // Additional stops needs some transforming to make it show
                            // errors in the form.
                            submissionError.errors.bookingAdditionalStops = submissionError.errors.bookingAdditionalStops.map(
                                (errors, i) => {
                                    let newErrors = errors.address || errors;
                                    // If the address is invalid we get an error on the postalCode field
                                    // (it won't be set). Use this to identify generic failure.
                                    if (newErrors.postalCode) {
                                        newErrors = ['Please enter a valid address'];
                                    }
                                    fieldsToTouch.push(`bookingAdditionalStops[${i}]`);
                                    return newErrors;
                                }
                            );
                        }
                        // Fields need to be touched or they won't show errors
                        formActions.touch(...fieldsToTouch);
                        formActions.stopSubmit(submissionError.errors);
                        formActions.setSubmitFailed();
                    }
                    throw e;
                })
                .finally(() => setRequestingPrice(false));
        },
        [formActions, record, store]
    );
    const onFormChange = useMemo(
        () =>
            debounce(
                () =>
                    requestPrice().catch(() => {
                        // Ignore errors for auto calculation - they propagate to the form automatically anyway
                    }),
                1500
            ),
        [requestPrice]
    );

    useEffect(() => {
        if (record) {
            requestPrice();
        }
    }, [record, requestPrice]);

    // accountRecord seems unstable, we just want to pass in a bare minimum to determine if the accountRecord is loaded
    // or not - the `id` field should suffice to trigger the below useEffect
    const priorAccountRecordId = record ? record.account : undefined;
    const accountRecordId = accountRecord ? accountRecord.id : undefined;
    useEffect(
        () => {
            if (
                accountRecordId &&
                accountRecordId !== priorAccountRecordId &&
                bookingPaymentMethod
            ) {
                const newBookingPaymentMethod = {
                    [PaymentMethodType.INVOICE.value]: BookingPaymentMethod.INVOICE.value,
                    [PaymentMethodType.CREDIT_CARD.value]: BookingPaymentMethod.CREDIT_CARD.value,
                    [PaymentMethodType.DRIVER_COLLECT.value]:
                        BookingPaymentMethod.DRIVER_COLLECT.value,
                }[accountRecord.paymentMethod];
                if (bookingPaymentMethod !== newBookingPaymentMethod) {
                    formActions.change('bookingPaymentMethod', newBookingPaymentMethod);
                }
            }
        },
        // We only want to react to the account being changed!
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [accountRecordId]
    );

    useEffect(() => {
        if (
            bookingPaymentMethod === BookingPaymentMethod.DRIVER_COLLECT.value &&
            driverCollectMethod === BookingDriverCollectMethod.NONE.value
        ) {
            // On initial selection of 'Driver Collect', we want to force the user to select a specific collection
            // method - set the Select value to something invalid.
            formActions.change('driverCollectMethod', DRIVER_SELECT_HINT);
        }
    }, [bookingPaymentMethod, driverCollectMethod, formActions]);

    const declineBookingHook = useAsyncRedux(() => declineBookingAction(record));
    const cancelBookingHook = useAsyncRedux(data => cancelBookingAction(record, data));
    const reinstateBookingHook = useAsyncRedux(() => reinstateBookingAction(record));

    const { formProps } = useModelFormProcessor({
        record,
        model: Booking,
        onSuccess: async response => {
            if (!record) {
                if (!response.requestReturn) {
                    // If the user didn't request a return booking, stay on the page, wipe fields except select few
                    message.success('Booking created');
                    const newParams = await Booking._meta.getDefaultValues();
                    Object.assign(
                        newParams,
                        pick(response.record, [
                            'account',
                            'clientUser',
                            'bookingType',
                            'passenger',
                            'passengerName',
                        ])
                    );
                    if (!newParams.passenger && newParams.passengerName) {
                        newParams.passengerGuest = true;
                    }
                    formActions.initialize(newParams);
                    setBookingReturnNumber({
                        id: response.record.id,
                        bookingNumber: response.record.bookingNumber,
                    });
                    setPriceBreakdown(null);
                } else {
                    // If the user did request a return booking, update the form and stay on the create page
                    message.success('Booking created, return booking requested');
                    const newParams = response.record.toJS();
                    newParams.travelOnDate = moment(newParams.travelOn).format('YYYY-MM-DD');
                    newParams.travelOn = null;
                    newParams.requestConfirmationEmail = false;
                    newParams.prepay = false;
                    if (newParams.destinationAddress) {
                        [newParams.fromAddress, newParams.destinationAddress] = [
                            newParams.destinationAddress,
                            newParams.fromAddress,
                        ];
                        [newParams.fromAddressType, newParams.destinationAddressType] = [
                            newParams.destinationAddressType,
                            newParams.fromAddressType,
                        ];
                        newParams.bookingAdditionalStops = newParams.bookingAdditionalStops
                            .map(e => ({ ...e.address, isPickUp: e.isPickUp }))
                            .reverse();
                    }
                    if (!newParams.passenger && newParams.passengerName) {
                        newParams.passengerGuest = true;
                    }

                    // We probably don't want out of pockets to be passed to a return booking
                    if (newParams.outOfPockets) {
                        newParams.outOfPockets = [];
                    }
                    // but we do want variations to come along with the booking, minus the saved
                    // record data. Just want the variation type and value so it can be used for
                    // this booking.
                    if (newParams.priceVariations) {
                        newParams.priceVariations = newParams.priceVariations.map(pv => ({
                            variationType: pv.variationType,
                            amount: pv.amount,
                        }));
                    }
                    formActions.initialize(newParams);
                    setPriceBreakdown(null);
                }
            } else if (
                record &&
                [BookingStatus.UNVERIFIED.value, BookingStatus.CHANGED.value].includes(
                    record.bookingStatus
                ) &&
                response.record.bookingStatus === BookingStatus.VERIFIED.value
            ) {
                message.success('Booking verified');
            } else {
                message.success('Booking saved');
            }
        },
        transformData,
        formName,
    });

    // Create booking script modal support
    const requestFormValues = useCallback(() => {
        const values = getFormValues(formName)(store.getState());
        if (
            !showConfirmCreateModal ||
            !priceBreakdown ||
            !hasRequiredValuesForPriceEstimate(values)
        ) {
            return false;
        }
        return values;
    }, [priceBreakdown, showConfirmCreateModal, store]);

    // Operators for save booking button
    const bookingSaveOperators = {
        createSubmit: () => setShowConfirmCreateModal(true),
        hasRequiredValuesForPriceEstimate,
        updateSubmit: formActions.submit,
    };

    const bookReturn = () => {
        formActions.change('requestReturn', true).then(() => formActions.submit());
    };

    const declineBooking = () => {
        if (record) {
            // send a req to upstream to delete & return to list view
            declineBookingHook.run().then(() => {
                message.success('Booking declined');
                history.push(Booking.getActionUrl('list'));
            });
        } else {
            // no actual booking to delete - just reset the form.
            formActions.reset();
        }
    };

    const cancelBooking = data => {
        if (record) {
            // send a req to upstream to delete & return to list view
            cancelBookingHook.run(data).then(() => {
                message.success('Booking cancelled');
                history.push(Booking.getActionUrl('list'));
            });
        } else {
            // no actual booking to delete - just reset the form.
            formActions.reset();
        }
    };

    const reinstateBooking = () => {
        if (record) {
            reinstateBookingHook
                .run()
                .then(() => {
                    message.success('Booking reinstated');
                    history.push(Booking.getActionUrl('list'));
                })
                .catch(() => message.error('Something went wrong, please try again'));
        } else {
            formActions.reset();
        }
    };

    let travelOnDate;
    let travelOnTime;

    if (record) {
        travelOnDate = moment(record.travelOn).format('YYYY-MM-DD');
        travelOnTime = moment(record.travelOn).format('HHmm');
    }

    const initialValues = record
        ? {
              ...record.toJS(),
              requestConfirmationEmail: false,
              confirmationEmailUser: record.clientUser,
              prepay: false,
              travelOnDate,
              travelOnTime,
              bookingAdditionalStops: record.bookingAdditionalStops
                  .map(e => ({
                      ...e.toJS().address,
                      isPickUp: e.isPickUp,
                      isValidAddress: true,
                  }))
                  .toJS(),
          }
        : undefined;
    if (record && !record.passenger && record.passengerName) {
        // This isn't saved to database but is used by PassengerGuestLookupWidget to
        // track presence of guest selection.
        initialValues.passengerGuest = true;
    }

    const mayReinstateBooking =
        record &&
        record.bookingStatus === BookingStatus.CANCELLED.value &&
        record.travelOn >= moment();

    // Determine whether to allow the booking to be declined
    const mayDeclineOrCancel =
        !record ||
        ![BookingStatus.COMPLETED.value, BookingStatus.CANCELLED.value].includes(
            record.bookingStatus
        );
    // Determine whether the booking has been invoiced
    const hasBeenInvoiced =
        record &&
        (record.invoiceSentDate || record.bookingStatus === BookingStatus.COMPLETED.value);
    // Determine whether to show the prepay button
    const mayPrepay = record && record.willChargeOnComplete && !record.invoiceSentDate;
    const isManagedInLegacy = record && record.isManagedInLegacy;

    return (
        <div key={record ? record.getId() : 'new-booking'}>
            <AdminPageHeader
                className={
                    record && record.bookingStatus === BookingStatus.CANCELLED.value
                        ? styles.cancelledStatus
                        : ''
                }
                header={
                    <>
                        {record
                            ? `Manage booking - ${record.bookingNumber}`
                            : 'Create a new booking'}
                        {bookingReturnNumber && (
                            <ActionLink
                                model={Booking}
                                params={{ id: bookingReturnNumber.id }}
                                action="update"
                                className={styles.bookingLink}
                            >
                                {' '}
                                View booking {bookingReturnNumber.bookingNumber}
                            </ActionLink>
                        )}
                        {record && (
                            <span className={styles.status}>
                                Status:{' '}
                                <FieldFormatter
                                    field={Booking._meta.fields.bookingStatus}
                                    value={record.bookingStatus}
                                />
                                {isManagedInLegacy && <span> (LEGACY BOOKING)</span>}
                            </span>
                        )}
                    </>
                }
                buttons={
                    !record && (
                        <Button
                            type="primary"
                            onClick={async () => {
                                const defaultParams = await Booking._meta.getDefaultValues();
                                formActions.initialize(defaultParams);
                            }}
                        >
                            Clear booking data
                        </Button>
                    )
                }
                htmlTitle={
                    record ? `Manage booking - ${record.bookingNumber}` : 'Create a new booking'
                }
            />
            <Breadcrumb to={match.url}>{record ? 'Update Booking' : 'Create Booking'}</Breadcrumb>
            <AdminBookingContext booking={record} missingPriceFields={missingPriceFields}>
                <FieldWidgetProvider getWidgetForField={getWidgetForField}>
                    <FieldFormatterProvider getFormatterForField={getFormatterForField}>
                        <ScbpModelForm
                            layout="vertical"
                            footer={null}
                            {...formProps}
                            initialValues={initialValues}
                            onChange={onFormChange}
                            className={styles.form}
                            validate={data => {
                                const errors = {};
                                if (data.travelOnTime) {
                                    const parseResult = moment(
                                        data.travelOnTime,
                                        ['HHmm', 'Hmm'],
                                        true
                                    );
                                    if (!parseResult.isValid()) {
                                        return {
                                            travelOnTime: `${data.travelOnTime} is not a valid time. Must be in format 'HHMM'.`,
                                        };
                                    }
                                }
                                return errors;
                            }}
                        >
                            <div className={styles.wrap}>
                                <div className={styles.main}>
                                    <BookingClientAccountEntryPanel
                                        formActions={formActions}
                                        readOnly={!!record}
                                        accountId={account}
                                        clientUserId={clientUser}
                                        onCreateClientUser={r =>
                                            formActions.change('clientUser', r.id)
                                        }
                                        onCreateAccount={r => formActions.change('account', r.id)}
                                    />
                                    <BookingDetailsEntryPanel
                                        accountId={account}
                                        clientUserId={clientUser}
                                        formName={formName}
                                    />
                                    <BookingTripRoutePanel
                                        bookingType={bookingType}
                                        accountId={account}
                                        clientUserId={
                                            passenger && passenger !== 'guest'
                                                ? passenger
                                                : clientUser
                                        }
                                    />

                                    <BookingOptionalExtrasPanel vehicleClassId={vehicleClass} />

                                    <BookingPanel label="Notes">
                                        <Row gutter={30}>
                                            <Col span={8}>
                                                <Item
                                                    name="driverNotes"
                                                    fieldProps={{
                                                        autoSize: {
                                                            minRows: 3,
                                                            maxRows: 6,
                                                        },
                                                    }}
                                                />
                                            </Col>
                                            <Col span={8}>
                                                <Item
                                                    name="officeNotes"
                                                    fieldProps={{
                                                        autoSize: {
                                                            minRows: 1,
                                                            maxRows: 3,
                                                        },
                                                    }}
                                                />
                                                <Item
                                                    name="adminGeneralNotes"
                                                    fieldProps={{
                                                        autoSize: {
                                                            minRows: 1,
                                                            maxRows: 3,
                                                        },
                                                    }}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <Item name="signboardText" />
                                                <Item name="purchaseOrderNumber" />
                                            </Col>
                                        </Row>
                                    </BookingPanel>
                                </div>
                                <div className={styles.aside}>
                                    {isManagedInLegacy && (
                                        <BookingPricingLegacySummary
                                            breakdown={
                                                new LegacyBookingPriceBreakdown(
                                                    record.legacyPriceBreakdown
                                                )
                                            }
                                        />
                                    )}
                                    {!isManagedInLegacy && (
                                        <BookingPricingSidePanel
                                            breakdown={priceBreakdown}
                                            requestPrice={requestPrice}
                                            isLoadingPrice={requestingPrice}
                                            formName={formName}
                                        />
                                    )}

                                    <Row>
                                        {record && (
                                            <Col span={12}>
                                                <TimeSection booking={record} />
                                                <Item
                                                    name="vehicle"
                                                    label="Vehicle"
                                                    fieldProps={{
                                                        showAdd: false,
                                                        showUpdate: false,
                                                    }}
                                                />
                                            </Col>
                                        )}
                                        <Col span={12}>
                                            <div className={styles.paymentMethod}>
                                                <Item
                                                    name="bookingMethod"
                                                    fieldProps={{
                                                        allowClear: false,
                                                        disabled: !!record,
                                                    }}
                                                />

                                                <Item
                                                    name="bookingPaymentMethod"
                                                    label="Payment Method"
                                                    fieldProps={{ allowClear: false }}
                                                />

                                                {bookingPaymentMethod ===
                                                    BookingPaymentMethod.DRIVER_COLLECT.value && (
                                                    <Item
                                                        name="driverCollectMethod"
                                                        label="Driver Collect Method"
                                                        fieldProps={{
                                                            allowClear: false,
                                                            choices: bookingDriverCollectMethodChoices,
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </Col>
                                    </Row>

                                    {!isManagedInLegacy && (
                                        <div className={styles.finalise}>
                                            <h3>Finalise</h3>
                                            {hasBeenInvoiced && (
                                                <div
                                                    style={{
                                                        fontWeight: 'bold',
                                                        marginBottom: '10px',
                                                    }}
                                                >
                                                    <Row>
                                                        <Col span={20}>
                                                            Invoice has been sent (
                                                            {record.invoiceSentDate})
                                                        </Col>
                                                        <Col span={4} style={{ align: 'right' }}>
                                                            {formatAuCurrency(
                                                                record.invoiceSentAmount
                                                            )}
                                                        </Col>
                                                    </Row>
                                                </div>
                                            )}
                                            <div>
                                                {record &&
                                                    ![
                                                        BookingStatus.UNVERIFIED.value,
                                                        BookingStatus.CHANGED.value,
                                                        BookingStatus.COMPLETED.value,
                                                    ].includes(record.bookingStatus) && (
                                                        <Row>
                                                            <Col span={10}>
                                                                <ScbpModelForm.Item
                                                                    name="requestConfirmationEmail"
                                                                    widget={SwitchWidget}
                                                                    fieldProps={{
                                                                        widgetProps: {
                                                                            checked: requestConfirmationEmail,
                                                                            onChange: checked =>
                                                                                formActions.change(
                                                                                    'requestConfirmationEmail',
                                                                                    checked
                                                                                ),
                                                                        },
                                                                    }}
                                                                />
                                                            </Col>
                                                            <Col span={14}>
                                                                {requestConfirmationEmail && (
                                                                    <ScbpModelForm.Item
                                                                        fieldProps={{
                                                                            allowClear: false,
                                                                            baseFilter: account
                                                                                ? {
                                                                                      account,
                                                                                      strict: true,
                                                                                  }
                                                                                : { strict: true },
                                                                            fromFieldName:
                                                                                'clientUser',
                                                                            fromModel: Booking,
                                                                            showAdd: false,
                                                                            showUpdate: false,
                                                                            toModel: ClientUser,
                                                                        }}
                                                                        label="Send Confirmation Email To"
                                                                        name="confirmationEmailUser"
                                                                        widget={
                                                                            RelatedModelLookupWidget
                                                                        }
                                                                    />
                                                                )}
                                                            </Col>
                                                        </Row>
                                                    )}
                                            </div>
                                            <div>
                                                {
                                                    <BookingSaveButton
                                                        accountId={account}
                                                        formName={formName}
                                                        hasRequiredValuesForPriceEstimate={
                                                            hasRequiredValuesForPriceEstimate
                                                        }
                                                        operators={bookingSaveOperators}
                                                        priceTotal={
                                                            priceBreakdown
                                                                ? priceBreakdown.total
                                                                : 0
                                                        }
                                                        record={record}
                                                    />
                                                }
                                                {mayDeclineOrCancel && record && (
                                                    <Popconfirm
                                                        title="Are you sure you want to decline this booking?"
                                                        onConfirm={declineBooking}
                                                        okText="Yes"
                                                        cancelText="No"
                                                    >
                                                        <Button
                                                            type="danger"
                                                            disabled={declineBookingHook.isLoading}
                                                        >
                                                            Decline
                                                        </Button>
                                                    </Popconfirm>
                                                )}
                                                {mayDeclineOrCancel && (
                                                    <Popconfirm
                                                        title="Are you sure you want to cancel this booking?"
                                                        onConfirm={() =>
                                                            setShowCancelBookingModal(true)
                                                        }
                                                        okText="Yes"
                                                        cancelText="No"
                                                    >
                                                        <Button
                                                            type="danger"
                                                            disabled={cancelBookingHook.isLoading}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </Popconfirm>
                                                )}
                                                {mayReinstateBooking && (
                                                    <Popconfirm
                                                        title="Are you sure you want to reinstate this booking?"
                                                        onConfirm={reinstateBooking}
                                                        okText="Yes"
                                                        cancelText="No"
                                                    >
                                                        <Button
                                                            type="primary"
                                                            disabled={cancelBookingHook.isLoading}
                                                        >
                                                            Reinstate Booking
                                                        </Button>
                                                    </Popconfirm>
                                                )}
                                                {record && <BookingLog booking={record.id} />}
                                                {mayPrepay && (
                                                    <FormButton action="PREPAY" htmlType="submit">
                                                        Prepay
                                                    </FormButton>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <ConfirmCreateModal
                                bookReturn={bookReturn}
                                closeModal={() => setShowConfirmCreateModal(false)}
                                priceBreakdown={priceBreakdown}
                                requestFormValues={requestFormValues}
                                submit={formActions.submit}
                            />
                        </ScbpModelForm>
                    </FieldFormatterProvider>
                </FieldWidgetProvider>
            </AdminBookingContext>
            <CancelBookingModal
                closeModal={() => setShowCancelBookingModal(false)}
                visible={showCancelBookingModal}
                submit={notes => cancelBooking({ notes })}
            />
        </div>
    );
}

BookingCreateUpdateView.propTypes = {
    record: modelInstance('scbp_core.booking'),
};
