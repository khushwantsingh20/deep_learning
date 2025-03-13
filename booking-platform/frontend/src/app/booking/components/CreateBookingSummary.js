import { Alert } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Link } from 'react-router-dom';
import { SubmissionError } from 'redux-form';
import DestinationAddressFormatter from '../../../common/components/DestinationAddressFormatter';
import FromAddressFormatter from '../../../common/components/FromAddressFormatter';
import InterstateAlert from './InterstateAlert';

import PriceSummaryBar from './PriceSummaryBar';
import { WriteOnlyBooking } from '../models';
import BookingPropTypes from '../prop-types';
import { BookingAddressType, BookingPaymentMethod } from '../../../choiceConstants';
import BookingSummaryEditLink from '../../../common/components/BookingSummaryEditLink';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import BookingPaymentWidget from '../../../common/form/BookingPaymentWidget';
import { formatAddress } from '../../../common/formatters/address';
import { formatAuCurrency } from '../../../common/formatters/numeric';
import VehicleClassDetails from '../../../common/ui/VehicleClassDetails';
import { ReactComponent as CancellationIcon } from '../../../images/icon-circle-cross.svg';
import { ReactComponent as MeetIcon } from '../../../images/icon-smile.svg';
import { useCardExpired } from '../hooks/useExpiredCard';

import styles from './CreateBookingController.less';

function TravelDetails({
    bookingFor,
    date,
    time,
    passengers,
    baggage,
    pickup,
    pickupInstructions,
    additionalStops,
    destination,
    destinationInstructions,
    holdDuration,
    isHourlyOutOfArea,
    onEditClick,
    fromAirportNotesForDriver,
    fromAddressType,
}) {
    const hourlyOutOfAreaDisplay = (
        <span>
            Trips beyond metropolitan area may incur a surcharge of between 10-20%, depending on
            distance travelled.
        </span>
    );

    return (
        <section className={styles.summaryDetails}>
            <div className={styles.summaryDetailsTitle}>
                <h3>Travel Details</h3>
                <BookingSummaryEditLink onClick={onEditClick} />
            </div>
            <dl>
                {bookingFor && (
                    <>
                        <dt>Booking for:</dt>
                        <dd>{bookingFor}</dd>
                    </>
                )}

                <dt>Day/Date:</dt>
                <dd>{date}</dd>

                <dt>Time:</dt>
                <dd>{time}</dd>

                <dt>Passengers:</dt>
                <dd>{passengers}</dd>

                {baggage >= 0 && (
                    <>
                        <dt>Checked in bags:</dt>
                        <dd>{baggage}</dd>
                    </>
                )}

                <dt>First Pick Up:</dt>
                <dd>
                    {pickup}
                    {pickupInstructions && <div>{pickupInstructions}</div>}
                </dd>

                {fromAddressType === BookingAddressType.AIRPORT.value &&
                    fromAirportNotesForDriver &&
                    fromAirportNotesForDriver.length > 0 && (
                        <>
                            <dt>Notes to driver:</dt>
                            <dd>{fromAirportNotesForDriver}</dd>
                        </>
                    )}

                {additionalStops.map((stop, i) => (
                    <React.Fragment key={i}>
                        <dt>Additional Stop at:</dt>
                        <dd>{stop}</dd>
                    </React.Fragment>
                ))}

                {destination && (
                    <>
                        <dt>Final Destination:</dt>
                        <dd>
                            {destination}

                            {destination && destinationInstructions && (
                                <div>{destinationInstructions}</div>
                            )}
                        </dd>
                    </>
                )}
                {holdDuration && (
                    <>
                        <dt>Duration</dt>
                        <dd>{holdDuration}</dd>
                    </>
                )}
            </dl>
            <ul className={styles.notes}>
                <li>
                    <MeetIcon aria-hidden="true" />
                    Includes Meet &amp; Greet
                </li>
                <li>
                    <CancellationIcon aria-hidden="true" />
                    Free cancellation up until two hours before pickup{' '}
                    <abbr title="see terms and conditions">*</abbr>
                </li>
            </ul>
            {isHourlyOutOfArea && <Alert description={hourlyOutOfAreaDisplay} type="warning" />}
            <small>
                <sup>*</sup> See our full{' '}
                <Link to="/terms-conditions/" target="_blank">
                    terms and conditions
                </Link>{' '}
                for further information.
            </small>
        </section>
    );
}

TravelDetails.propTypes = {
    bookingFor: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    passengers: PropTypes.number,
    baggage: PropTypes.number,
    pickup: PropTypes.node,
    pickupInstructions: PropTypes.string,
    additionalStops: PropTypes.arrayOf(PropTypes.node),
    destination: PropTypes.node,
    destinationInstructions: PropTypes.string,
    holdDuration: PropTypes.string,
    isHourlyOutOfArea: PropTypes.bool,
    onEditClick: PropTypes.func.isRequired,
    fromAirportNotesForDriver: PropTypes.string,
    fromAddressType: PropTypes.number,
};

function OptionalExtras({
    boosterSeatCount,
    forwardFacingBabySeatCount,
    rearFacingBabySeatCount,
    requiresWeddingRibbons,
    vehicleColor,
    additionalStops,
    onEditClick,
}) {
    const hasExtras =
        boosterSeatCount ||
        forwardFacingBabySeatCount ||
        rearFacingBabySeatCount ||
        requiresWeddingRibbons ||
        vehicleColor ||
        (additionalStops && additionalStops.length > 0);

    return (
        <section className={styles.summaryDetails}>
            <div className={styles.summaryDetailsTitle}>
                <h3>Optional Extras</h3>
                <BookingSummaryEditLink onClick={onEditClick} />
            </div>

            {hasExtras ? (
                <dl>
                    {additionalStops && additionalStops.length > 0 && (
                        <>
                            <dt>Additional stops:</dt>
                            <dd>
                                {additionalStops.map(stop => (
                                    <div
                                        key={stop.sourceId}
                                        className={styles.summaryAdditionalStop}
                                    >
                                        <>
                                            {stop.placeName ? <div>{stop.placeName}</div> : ''}
                                            {formatAddress(stop.formattedAddress)}
                                        </>
                                    </div>
                                ))}
                            </dd>
                        </>
                    )}
                    {boosterSeatCount > 0 && (
                        <>
                            <dt>Booster seats:</dt>
                            <dd>{boosterSeatCount}</dd>
                        </>
                    )}
                    {forwardFacingBabySeatCount > 0 && (
                        <>
                            <dt>Forward facing baby seats:</dt>
                            <dd>{forwardFacingBabySeatCount}</dd>
                        </>
                    )}
                    {rearFacingBabySeatCount > 0 && (
                        <>
                            <dt>Rear facing baby seats:</dt>
                            <dd>{rearFacingBabySeatCount}</dd>
                        </>
                    )}
                    {requiresWeddingRibbons && (
                        <>
                            <dt>Wedding ribbons:</dt>
                            <dd>Yes</dd>
                        </>
                    )}
                    {vehicleColor && (
                        <>
                            <dt>Custom Vehicle Colour:</dt>
                            <dd>{vehicleColor.title}</dd>
                        </>
                    )}
                </dl>
            ) : (
                <p>No extras have been selected.</p>
            )}
        </section>
    );
}

OptionalExtras.propTypes = {
    boosterSeatCount: PropTypes.number,
    forwardFacingBabySeatCount: PropTypes.number,
    rearFacingBabySeatCount: PropTypes.number,
    requiresWeddingRibbons: PropTypes.bool,
    vehicleColor: PropTypes.object,
    additionalStops: PropTypes.array,
    onEditClick: PropTypes.func.isRequired,
};

function BookingNotes() {
    return (
        <fieldset className={styles.bookingNotesFieldSet}>
            <ScbpModelForm.Item
                name="driverNotes"
                label={
                    <>
                        Notes for driver:
                        <span className={styles.bookingNotesHelpText}>
                            (Include any luggage comments)
                        </span>
                    </>
                }
                fullWidth
                colon={false}
            />
            <ScbpModelForm.Item
                name="officeNotes"
                label={
                    <>
                        Notes for office:
                        <span className={styles.bookingNotesHelpText}>(Not visible to driver)</span>
                    </>
                }
                fullWidth
                colon={false}
            />
            <ScbpModelForm.Item
                name="purchaseOrderNumber"
                label={
                    <>
                        Purchase Order Number:
                        <span className={styles.bookingNotesHelpText}>(Optional)</span>
                    </>
                }
                fullWidth
                colon={false}
            />
            <ScbpModelForm.Item
                name="signboardText"
                colon={false}
                fullWidth
                label={
                    <>
                        Special Signboard:
                        <span className={styles.bookingNotesHelpText}>
                            For pickup of passengers at airports, stations, etc.
                        </span>
                    </>
                }
                extra="Max 100 characters"
            />
        </fieldset>
    );
}

function getBasePriceComponents(priceBreakdown) {
    return [
        ...priceBreakdown.formatted.toJS().map(({ label, value }) => [label, value]),
        [<strong>Total</strong>, <strong>{formatAuCurrency(priceBreakdown.total)}</strong>],
    ];
}

function CreateBookingSummaryPriceNote() {
    return (
        <div className={styles.summaryPriceNote}>
            This price is inclusive of tolls, GST and state government booking fee.
            <br />
            View our full{' '}
            <Link to="/terms-conditions/" target="_blank">
                terms and conditions
            </Link>
            .
        </div>
    );
}

export default function CreateBookingSummary({
    bookingContext,
    headerBar,
    steps,
    goToStep,
    onSubmit,
    ...props
}) {
    const isExpired = useCardExpired(bookingContext.data.account);
    const {
        vehicleClass,
        data: {
            fromAddress,
            destinationAddress,
            passengerCount,
            baggageCount,
            hourlyBookingDuration,
            travelOnDate: travelOnDateRaw,
            travelOnTime: travelOnTimeRaw,
            boosterSeatCount,
            forwardFacingBabySeatCount,
            rearFacingBabySeatCount,
            requiresWeddingRibbons,
            vehicleColorId,
            additionalStops,
            destinationAirportTerminal,
            fromAirportNotesForDriver,
            fromAddressType,
        },
        currentPrice,
        isInterstate,
        isHourlyOutOfArea,
    } = bookingContext;

    function validateForm(data) {
        const { bookingPaymentMethod } = data;
        return {
            bookingPaymentMethod:
                isExpired &&
                bookingPaymentMethod === BookingPaymentMethod.CREDIT_CARD.value &&
                'Your credit card has expired',
        };
    }

    function handleSubmit(data) {
        if (isExpired && data.bookingPaymentMethod === BookingPaymentMethod.CREDIT_CARD.value) {
            throw new SubmissionError({
                _error:
                    'The credit card associated with your account has expired. Please update your details.',
            });
        }

        return onSubmit(data);
    }

    const travelOnDate = moment(travelOnDateRaw).format('dddd, Do MMMM YYYY');
    const travelOnTime = moment(travelOnTimeRaw, 'HH:mm').format('LT');

    const vehicleColor = vehicleClass.availableColors.find(c => c.id === Number(vehicleColorId));
    const goToSteps = steps.map(step => () => goToStep(step));

    const travelDetailPriceComponents = getBasePriceComponents(currentPrice.breakdown);
    // Terminal chosen value.
    const destinationAirportTerminalName = new Map(
        WriteOnlyBooking._meta.fields.destinationAirportTerminal.choices
    ).get(destinationAirportTerminal);

    const holdDuration = hourlyBookingDuration
        ? hourlyBookingDuration.slice(0, 5).replace(/^0/, '')
        : null;
    const isHourly = !!hourlyBookingDuration;
    const formattedAdditionalStops = (additionalStops || []).map(stop => (
        <>
            {stop.isPickUp ? <div>Pick Up at</div> : ''}
            {stop.placeName ? <div>{stop.placeName}</div> : ''}
            {formatAddress(stop.formattedAddress)}
            {stop.addressInstructions && <div>{stop.addressInstructions}</div>}
        </>
    ));
    // For hourly bookings show the last additional stop as the destination
    const destination = isHourly ? (
        formattedAdditionalStops.pop()
    ) : (
        <DestinationAddressFormatter
            booking={bookingContext.data}
            airportTerminalName={destinationAirportTerminalName}
        />
    );
    const pickup = <FromAddressFormatter booking={bookingContext.data} />;

    return (
        <div className={styles.optionWrapper}>
            <ScbpModelForm
                {...props}
                validate={validateForm}
                onSubmit={handleSubmit}
                defaultWrapperCol={{ sm: { span: 24 }, xl: { span: 24 } }}
            >
                {headerBar && headerBar}
                {isInterstate && <InterstateAlert />}
                <PriceSummaryBar
                    total={currentPrice.price}
                    priceBreakdown={travelDetailPriceComponents}
                />
                <CreateBookingSummaryPriceNote />
                <TravelDetails
                    date={travelOnDate}
                    time={travelOnTime}
                    passengers={passengerCount}
                    baggage={baggageCount}
                    additionalStops={formattedAdditionalStops}
                    pickup={pickup}
                    pickupInstructions={fromAddress.addressInstructions}
                    pickupAddressLabel={fromAddress.addressLabel}
                    destination={destination}
                    destinationInstructions={
                        destinationAddress ? destinationAddress.addressInstructions : ''
                    }
                    destinationAddressLabel={
                        destinationAddress ? destinationAddress.addressLabel : ''
                    }
                    holdDuration={holdDuration}
                    isHourlyOutOfArea={isHourlyOutOfArea}
                    onEditClick={goToSteps.get(0)}
                    fromAirportNotesForDriver={fromAirportNotesForDriver}
                    fromAddressType={fromAddressType}
                />
                <section className={styles.summaryDetails}>
                    <VehicleClassDetails
                        isSummary
                        {...vehicleClass.toJS()}
                        onEditClick={goToSteps.get(1)}
                    />
                </section>
                <OptionalExtras
                    subTotal={currentPrice.breakdown.options.subtotal}
                    boosterSeatCount={boosterSeatCount}
                    forwardFacingBabySeatCount={forwardFacingBabySeatCount}
                    rearFacingBabySeatCount={rearFacingBabySeatCount}
                    requiresWeddingRibbons={requiresWeddingRibbons}
                    vehicleColor={vehicleColor}
                    additionalStops={additionalStops}
                    onEditClick={goToSteps.get(2)}
                />
                <section className={styles.summaryDetails}>
                    <div className={styles.summaryDetailsTitle}>
                        <h3>Using Which Payment Method:</h3>
                    </div>
                    <ScbpModelForm.Item
                        label={null}
                        name="bookingPaymentMethod"
                        widget={BookingPaymentWidget}
                    />
                </section>
                <BookingNotes {...props} />
                <PriceSummaryBar total={currentPrice.price} />
                <CreateBookingSummaryPriceNote />
            </ScbpModelForm>
        </div>
    );
}

CreateBookingSummary.propTypes = {
    bookingContext: BookingPropTypes.bookingContext.isRequired,
    headerBar: PropTypes.node,
    // This is list of BookingStep but due to circular imports importing it here doesn't quite work (it's undefined due to order)
    steps: ImmutablePropTypes.listOf(PropTypes.object).isRequired,
    goToStep: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
};
