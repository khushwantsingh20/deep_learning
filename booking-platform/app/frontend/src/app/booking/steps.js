import Immutable from 'immutable';
import { List, Record, Typed, Map, Any } from 'typed-immutable';

import { BookingAddressType, BookingPaymentMethod, BookingType } from '../../choiceConstants';
import CreateBookingFinalizeForm from './components/CreateBookingFinalizeForm';
import CreateBookingOptionsForm from './components/CreateBookingOptionsForm';
import CreateBookingSummary from './components/CreateBookingSummary';
import CreateBookingVehicleClassForm from './components/CreateBookingVehicleClassForm';
import CreateBookingTravelDetailsForm from './components/CreateBookingTravelDetailsForm';

const Func = Typed('Function', value => {
    if (typeof value !== 'function') {
        throw new Error(`Must be function, got ${value}`);
    }
    return value;
});

const BookingStepRecord = new Record({
    name: String,
    component: Func,
    urlPart: String,
    dataKeys: List(String),
    defaultValues: Map(String, Any),
    // This is defined on the step so we can validate all steps at any time
    validate: Func,
});

// eslint-disable-next-line import/no-mutable-exports
let steps;

export class BookingStep extends BookingStepRecord {
    isFirst() {
        return steps.first() === this;
    }
    isLast() {
        return steps.last() === this;
    }
    isLoginRequiredToContinue() {
        return this.name === 'Booking Summary';
    }
    isCompleteBookingStep() {
        return this.name === 'Booking Summary';
    }
    getStepIndex() {
        return steps.findIndex(s => s === this);
    }
    getNext() {
        return steps.get(this.getStepIndex() + 1);
    }
    getPrevious() {
        return steps.get(this.getStepIndex() - 1);
    }
    getFormName() {
        return `step-${this.getStepIndex()}`;
    }
    getCount() {
        return steps.size;
    }
}

const isLessThanEqual = (count, limit) => count && count <= limit;

/**
 * Validate the travelOn date and time fields. Returns string error if invalid else null;
 */
function validateTravelOn(travelOnDate, travelOnTime) {
    if (!travelOnDate && !travelOnTime) {
        return 'Please select travel date and time';
    }
    if (!travelOnDate) {
        return 'Please select travel date';
    }
    if (!travelOnTime) {
        return 'Please select travel time';
    }
    return null;
}

steps = Immutable.List([
    new BookingStep({
        name: 'Travel Details',
        urlPart: '',
        component: CreateBookingTravelDetailsForm,
        dataKeys: [
            'account',
            'passengerCount',
            'baggageCount',
            'fromAddressType',
            'fromAddress',
            'fromFlightNumber',
            'fromAirportDriverRequiredOnLanding',
            'fromAirportArrivalAfterLanding',
            'fromAirportNotesForDriver',
            'travelOnDate',
            'travelOnTime',
            'bookingType',
            'destinationAddressType',
            'destinationAddress',
            'destinationFlightNumber',
            'destinationAirportTerminal',
            'destinationFlightDepartureTime',
            'hourlyBookingDuration',
            'passenger',
            'passengerGuest',
            'passengerName',
            'passengerPhone',
        ],
        defaultValues: {
            fromAirportDriverRequiredOnLanding: true,
            fromAirportArrivalAfterLanding: 0,
            bookingType: BookingType.ONE_WAY.value,
            passengerCount: 1,
            baggageCount: 0,
        },
        validate(data, bookingContext) {
            const errors = {
                travelOnDate: validateTravelOn(data.travelOnDate, data.travelOnTime),
                fromAddressType: data.fromAddressType === null && 'Please select pickup location',
                fromAddress:
                    data.fromAddressType === BookingAddressType.CUSTOM.value &&
                    (!data.fromAddress || !data.fromAddress.isValidAddress) &&
                    "Sorry, we can't find that address. Try again or call 1300 12 LIMO to book over the phone",
                passengerCount:
                    !isLessThanEqual(data.passengerCount, bookingContext.passengerCountLimit) &&
                    'Please select number of passengers',
                baggageCount:
                    (data.baggageCount === null ||
                        !(data.baggageCount <= bookingContext.baggageCountLimit)) &&
                    'Please select number of bags',
            };

            if (data.bookingType === BookingType.ONE_WAY.value) {
                // Unset hourly specific fields
                data.hourlyBookingDuration = null;
                // Process errors for one-way specific fields
                Object.assign(errors, {
                    destinationAddressType:
                        data.destinationAddressType === null && 'Please select destination address',
                    destinationAddress:
                        data.destinationAddressType === BookingAddressType.CUSTOM.value &&
                        (!data.destinationAddress || !data.destinationAddress.isValidAddress) &&
                        "Sorry, we can't find that address. Try again or call 1300 12 LIMO to book over the phone",
                });
                if (
                    data.fromAddress &&
                    data.destinationAddress &&
                    data.fromAddress.sourceId === data.destinationAddress.sourceId
                ) {
                    errors.destinationAddress = 'Drop off address must be different to pickup';
                }
            } else {
                // Unset one-way specific fields
                data.destinationAddress = null;
                data.destinationAddressType = null;
                // Process errors for hourly specific fields
                Object.assign(errors, {
                    hourlyBookingDuration:
                        !data.hourlyBookingDuration && 'Please select the duration of the booking',
                });
            }

            return errors;
        },
    }),
    new BookingStep({
        name: 'Vehicle Class',
        urlPart: 'car-class',
        component: CreateBookingVehicleClassForm,
        dataKeys: ['vehicleClassId'],
        validate(data, bookingContext) {
            let vehicle;
            if (data.vehicleClassId) {
                // Make sure it's a valid vehicle. This is primarily from when we rehydrate from session
                // data which could be invalid.
                const vehicleClassId = Number(data.vehicleClassId);
                vehicle = bookingContext.vehicleClasses.find(v => v.getId() === vehicleClassId);
            }
            return {
                vehicleClassId: !vehicle && 'Please select vehicle class',
            };
        },
    }),
    new BookingStep({
        name: 'Optional Extras',
        urlPart: 'options',
        component: CreateBookingOptionsForm,
        dataKeys: [
            'boosterSeatCount',
            'forwardFacingBabySeatCount',
            'rearFacingBabySeatCount',
            'vehicleColorId',
            'requiresWeddingRibbons',
            'additionalStops',
        ],
        validate() {
            return {};
        },
    }),
    new BookingStep({
        name: 'Booking Summary',
        urlPart: 'summary',
        component: CreateBookingSummary,
        dataKeys: [
            'driverNotes',
            'officeNotes',
            'signboardText',
            'purchaseOrderNumber',
            'bookingPaymentMethod',
            'driverCollectMethod',
        ],
        defaultValues: {
            bookingPaymentMethod: BookingPaymentMethod.CREDIT_CARD.value,
        },
        validate() {
            return {};
        },
    }),
    new BookingStep({
        name: 'Finalise',
        urlPart: 'finalise',
        component: CreateBookingFinalizeForm,
        dataKeys: [],
        validate() {
            return {};
        },
    }),
]);

export default steps;
