import { Col, Row, Tabs } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import SwitchWidget from '@alliance-software/djrad/components/form/widgets/SwitchWidget';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import useSettings from '@alliance-software/djrad/hooks/useSettings';

import { BookingType } from '../../../choiceConstants';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { getAddressComponents } from '../../../common/form/AddressLookupWidget';
import DateWidget from '../../../common/form/DateWidget';
import FlightNumberWidget from '../../../common/form/FlightNumberWidget';
import TimeWidget from '../../../common/form/TimeWidget';
import NumericChoicesWidget from '../../../common/ui/NumericChoicesWidget';
import { useActiveAccount } from '../../user/hooks';
import { User } from '../../user/models';
import { ReactComponent as IconTime } from '../../../images/icon-clockface.svg';
import useAddressBook from '../hooks/useAddressBook';
import BookingPropTypes from '../prop-types';
import BookingAddressCapture from './BookingAddressCapture';
import { ReactComponent as IconPassenger } from '../../../images/icon-person-luggage.svg';
import { ReactComponent as IconWhen } from '../../../images/icon-calendar.svg';
import { ReactComponent as PickupIcon } from '../../../images/icon-clock.svg';
import { ReactComponent as RightChevron } from '../../../images/icon-right-chevron.svg';

import styles from './CreateBookingController.less';
import PassengerSelectFormItem from '../../../common/components/PassengerSelectFormItem';
import useUserLocation from '../../../common/hooks/useUserLocation';

const { TabPane } = Tabs;

function beforeToday(current) {
    return current && current < moment().startOf('day');
}

function InnerForm({ bookingContext, bookingType, hideLandingArrivalDelay, ...props }) {
    const { fromAddress: initFromAddress } = props.initialValues;
    const currentUser = useSelector(User.selectors.currentUser);
    const formActions = useFormActions(props.name);
    const activeAccount = useActiveAccount();
    const { passenger } = useFormValues(props.name, ['passenger'], {
        passenger: currentUser && currentUser.id,
    });

    const { error, location } = useUserLocation();

    useEffect(() => {
        if (location && !initFromAddress) {
            // dont change address again if we already manually picked one and is revisiting this page
            const addressComponents = getAddressComponents(location.address_components);
            if (
                location.place_id &&
                addressComponents.locality &&
                location.geometry &&
                location.geometry.location
            ) {
                formActions.change('fromAddress', {
                    addressDetails: {
                        addressComponents,
                    },
                    suburb: addressComponents.locality.longName,
                    formattedAddress: location.formatted_address,
                    sourceId: location.place_id,
                    lat: location.geometry.location.lat(),
                    long: location.geometry.location.lng(),
                    postalCode: location.address_components.find(e => e.types[0] === 'postal_code')
                        .short_name,
                    isValidAddress: true,
                });
            }
        }
    }, [formActions, location, initFromAddress]);

    const { bookingLimits } = useSettings();

    const { addressBook, addressClientId, canAddAddress, isLoading } = useAddressBook({
        passenger,
    });

    const duration = (
        <fieldset>
            <legend>Duration:</legend>
            <div className={`${styles.duration} ${styles.formItemWrapper}`}>
                <span className={styles.icon}>
                    <IconTime />
                </span>
                <ScbpModelForm.Item
                    label=""
                    name="hourlyBookingDuration"
                    fieldProps={{
                        minuteStep: 10,
                        maxDurationMinutes: bookingLimits.maxDurationHours * 60,
                        minDurationMinutes: bookingLimits.minDurationHours * 60,
                    }}
                />
            </div>
        </fieldset>
    );

    const destination = (
        <fieldset className={styles.toOptions} data-testid="address-destination">
            <legend>Your final destination:</legend>
            <BookingAddressCapture
                formName={props.name}
                addressTypeFieldName="destinationAddressType"
                addressFieldName="destinationAddress"
                addresses={addressBook}
                isLoading={isLoading}
                canAddAddress={canAddAddress}
                currentUserId={addressClientId}
                onClear={() => {
                    formActions.change('destinationAddress', null);
                    formActions.change('destinationFlightDepartureTime', null);
                    formActions.change('destinationAirportTerminal', null);
                }}
            >
                <>
                    <ScbpModelForm.Item name="destinationAirportTerminal" label="Terminal" />
                    <ScbpModelForm.Item
                        name="destinationFlightDepartureTime"
                        label="Your flight departure time"
                    >
                        <ScbpModelForm.Field
                            name="destinationFlightDepartureTime"
                            widget={TimeWidget}
                            widgetProps={{ minuteStep: 5 }}
                        />
                    </ScbpModelForm.Item>
                </>
            </BookingAddressCapture>
        </fieldset>
    );

    if (error) {
        return <p>There was an unexpected problem. Please refresh the page and try again.</p>;
    }
    return (
        <ScbpModelForm {...props} layout="vertical">
            {currentUser && (
                <>
                    {activeAccount && (
                        <div className={styles.accountName}>
                            <span className={styles.accountLabel}>Account:</span>
                            {activeAccount.accountNickname}
                        </div>
                    )}
                    <fieldset className={styles.fromOptions}>
                        <legend>Passenger&apos;s Name:</legend>
                        <PassengerSelectFormItem
                            user={currentUser}
                            account={activeAccount}
                            formName={props.name}
                        />
                    </fieldset>
                </>
            )}
            <fieldset className={styles.fromOptions} data-testid="address-pickup">
                <legend>Your first pickup address:</legend>
                <BookingAddressCapture
                    formName={props.name}
                    addressTypeFieldName="fromAddressType"
                    addressFieldName="fromAddress"
                    addresses={addressBook}
                    canAddAddress={canAddAddress}
                    currentUserId={addressClientId}
                    onClear={() => {
                        formActions.change('fromAddress', null);
                        formActions.change('fromFlightNumber', '');
                        formActions.change('fromAirportDriverRequiredOnLanding', false);
                        formActions.change('fromAirportArrivalAfterLanding', 0);
                        formActions.change('fromAirportNotesForDriver', '');
                    }}
                >
                    <>
                        <ScbpModelForm.Item
                            label="Flight number"
                            name="fromFlightNumber"
                            widget={
                                <FlightNumberWidget
                                    size="large"
                                    autoFocus
                                    placeholder="Enter your flight number"
                                />
                            }
                        />
                        <ScbpModelForm.Item
                            label="Do you wish for your driver to be in the terminal from landing time?"
                            name="fromAirportDriverRequiredOnLanding"
                            widget={<SwitchWidget checkedChildren="Yes" unCheckedChildren="No" />}
                        />
                        {!hideLandingArrivalDelay && (
                            <ScbpModelForm.Item label="How long after landing should the driver arrive at the airport?">
                                <Row>
                                    <Col md={{ span: 12 }}>
                                        <ScbpModelForm.Field name="fromAirportArrivalAfterLanding" />
                                    </Col>
                                </Row>
                            </ScbpModelForm.Item>
                        )}
                        <ScbpModelForm.Item
                            label="Notes for the Driver"
                            name="fromAirportNotesForDriver"
                        />
                        <div className="ant-row">
                            <ul className={styles.notes}>
                                <li>
                                    <PickupIcon aria-hidden="true" />
                                    Includes meet and greet inside terminal and a further 30 minutes
                                    grace applies for all pick-ups from Melbourne Airport
                                </li>
                            </ul>
                        </div>
                    </>
                </BookingAddressCapture>
            </fieldset>

            {bookingType === BookingType.ONE_WAY.value && destination}

            {bookingType === BookingType.HOURLY.value && duration}

            <fieldset>
                <legend>Booking Time:</legend>
                <div className={styles.formItemWrapper}>
                    <ScbpModelForm.Item label={null}>
                        <span className={styles.icon} style={{ marginRight: '20px' }}>
                            <IconWhen />
                        </span>
                        <div>
                            <div className="ant-col ant-form-item-label">
                                <label htmlFor="travelOnDate">Date:</label>
                            </div>
                            <ScbpModelForm.Field
                                name="travelOnDate"
                                widget={
                                    <DateWidget
                                        disabledDate={beforeToday}
                                        onBlur={() => {}}
                                        showToday={false}
                                    />
                                }
                            />{' '}
                        </div>
                        <div>
                            <div className="ant-col ant-form-item-label">
                                <label htmlFor="travelOnTime">Time:</label>
                            </div>

                            <ScbpModelForm.Field
                                name="travelOnTime"
                                widget={<TimeWidget minuteStep={5} use12Hours format="hh:mm a" />}
                            />
                        </div>
                    </ScbpModelForm.Item>
                </div>
            </fieldset>
            <fieldset>
                <legend>Passengers and Baggage:</legend>
                <div className={styles.formItemWrapper}>
                    <ScbpModelForm.Item>
                        <span className={styles.icon}>
                            <IconPassenger />
                        </span>
                        <div>
                            <div className="ant-col ant-form-item-label">
                                <label htmlFor="passengerCount">No. of Passengers:</label>
                            </div>
                            <ScbpModelForm.Field
                                id="passengerCount"
                                name="passengerCount"
                                widget={
                                    <NumericChoicesWidget
                                        min={1}
                                        max={bookingContext.passengerCountLimit}
                                    />
                                }
                            />
                        </div>
                        <div>
                            <div className="ant-col ant-form-item-label">
                                <label htmlFor="baggageCount">Checked in baggage:</label>
                            </div>
                            <ScbpModelForm.Field
                                id="baggageCount"
                                name="baggageCount"
                                widget={
                                    <NumericChoicesWidget max={bookingContext.baggageCountLimit} />
                                }
                            />
                        </div>
                    </ScbpModelForm.Item>
                    <div className={styles.bookingTravelDetailPassengerNote}>
                        For bookings of more than {bookingContext.passengerCountLimit} passengers, a
                        second car needs to be booked. For bookings of more than 1 car, please feel
                        welcome to call the office to discuss on{' '}
                        <span className={styles.phoneNumber}>1300 12 LIMO</span>
                    </div>
                </div>
            </fieldset>
        </ScbpModelForm>
    );
}

InnerForm.propTypes = {
    bookingContext: BookingPropTypes.bookingContext.isRequired,
    name: PropTypes.string,
    bookingType: BookingPropTypes.choicesType(BookingType).isRequired,
    hideLandingArrivalDelay: PropTypes.bool,
    initialValues: PropTypes.object,
};

export default function CreateBookingTravelDetailsForm(props) {
    const formActions = useFormActions(props.name);
    const { bookingType, fromAirportDriverRequiredOnLanding } = useFormValues(
        props.name,
        ['bookingType', 'fromAirportDriverRequiredOnLanding'],
        {
            bookingType: props.initialValues.bookingType,
        }
    );

    const { bookingContext, currentUser, location } = props;
    const [showTabs, setShowTabs] = useState(
        currentUser || Object.keys(bookingContext.data).length !== 0
    );

    if (!showTabs && location.state && location.state.showTabs) {
        setShowTabs(true);
    }

    return (
        <div className={styles.optionWrapper} id="booking-form-wrapper">
            <div className={styles.tabCta}>
                <div>
                    <span>Get a quick quote</span>
                </div>
            </div>
            <Tabs
                className={styles.tabs}
                type="card"
                activeKey={String(bookingType)}
                onChange={t => formActions.change('bookingType', Number(t))}
                onTabClick={() => setShowTabs(true)}
            >
                <TabPane
                    tab={
                        <span data-testid="one-way-trip-tab">
                            One Way Trip <RightChevron className={styles.tabIcon} />
                        </span>
                    }
                    key={String(BookingType.ONE_WAY.value)}
                >
                    <div aria-hidden={!showTabs}>
                        <InnerForm
                            bookingType={BookingType.ONE_WAY.value}
                            hideLandingArrivalDelay={fromAirportDriverRequiredOnLanding}
                            {...props}
                        />
                    </div>
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            Hourly <RightChevron className={styles.tabIcon} />
                        </span>
                    }
                    key={String(BookingType.HOURLY.value)}
                >
                    <div aria-hidden={!showTabs}>
                        <InnerForm
                            bookingType={BookingType.HOURLY.value}
                            hideLandingArrivalDelay={fromAirportDriverRequiredOnLanding}
                            {...props}
                        />
                    </div>
                </TabPane>
            </Tabs>
        </div>
    );
}

CreateBookingTravelDetailsForm.propTypes = {
    bookingContext: BookingPropTypes.bookingContext.isRequired,
    initialValues: PropTypes.object.isRequired,
    currentUser: PropTypes.object,
    name: PropTypes.string,
};
