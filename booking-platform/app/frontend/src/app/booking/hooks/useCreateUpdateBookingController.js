import pick from 'lodash/pick';
import { List, Record } from 'typed-immutable';
import { modelDetailRoute, modelListRoute } from '@alliance-software/djrad/actions';
import { handleErrorResponse } from '@alliance-software/djrad/components/form';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import { useCallback, useEffect, useState, useRef } from 'react';
import { BookingPriceBreakdown } from '../../../common/records';
import { useActiveAccount, useCurrentUser } from '../../user/hooks';
import { WriteOnlyBooking } from '../models';
import steps from '../steps';
import useUserDeviceToken from '../../../common/hooks/useUserDeviceToken';
import { BookingMethod } from '../../../choiceConstants';

const VehicleClassPriceRecord = new Record({
    vehicleClassId: Number,
    breakdown: BookingPriceBreakdown,
    formattedBreakdown: List(
        Record({
            label: String,
            value: String,
        })
    ),
    price: String,
});
class VehicleClassPrice extends VehicleClassPriceRecord {
    getOptionsSubTotal() {
        return this.breakdown.options ? this.breakdown.options.subtotal : 0;
    }
    getPriceWithoutOptions() {
        return this.breakdown.total - this.getOptionsSubTotal();
    }
}

function transformData(data) {
    return {
        ...data,
        ...(!data.additionalStops
            ? {}
            : {
                  additionalStops: data.additionalStops.map((e, idx) => ({
                      address: e,
                      stopNumber: idx + 1,
                      isPickUp: e ? e.isPickUp : false,
                  })),
              }),
    };
}

function validateBookingStep(data, stepIndex) {
    return reduxDispatch => {
        return reduxDispatch(
            modelListRoute('post', WriteOnlyBooking, 'validate-step', {
                ...transformData(data),
                stepIndex,
            })
        ).then(response => {
            if (response.errors) {
                return response;
            }
            const vehicleClassPrices = response.vehicleClassPrices.reduce(
                (acc, vehicleClassPrice) => {
                    acc[vehicleClassPrice.vehicleClassId] = new VehicleClassPrice(
                        vehicleClassPrice
                    );
                    return acc;
                },
                {}
            );

            return {
                ...response,
                vehicleClassPrices,
            };
        });
    };
}

function saveBooking(data) {
    return dispatch =>
        dispatch(modelListRoute('post', WriteOnlyBooking, 'create-booking', transformData(data)));
}

function updateBooking(booking, data) {
    return reduxDispatch => {
        return reduxDispatch(
            modelDetailRoute('post', booking, 'update-booking', transformData(data))
        );
    };
}

function loadPriceOptions(travelOnDate, travelOnTime) {
    return dispatch =>
        dispatch(
            modelListRoute('post', WriteOnlyBooking, 'price-options', {
                travelOnDate,
                travelOnTime,
            })
        ).then(response => response.priceOptions);
}

/**
 * Controller that manages fetching prices, validating each steps and creating/updating a booking
 * @param currentStep The step currently shown to user
 * @param bookingState Current booking state. In simple case can just pass return value of `useState` call. For creates
 * we also cache values in local storage - see `useCreateBookingState`.
 * @param setBookingState Setter to change booking state.
 * @param existingBooking For updates this should be the existing booking
 */
export default function useCreateUpdateBookingController(
    currentStep,
    // When reversing bookings we need to set the create state (eg. after updating an existing booking)
    // setCreateBookingState handles this - for creation it will be same as setBookingState
    [bookingState, setBookingState, setCreateBookingState],
    existingBooking = null
) {
    const { token } = useUserDeviceToken();
    const [furthestStepAvailable, setFurthestStepAvailable] = useState(null);
    const [completedBooking, setCompletedBooking] = useState(null);
    const [reverseBookingState, setReverseBooking] = useState(null);
    // Select all vehicle classes up front. We need this in step 2 but also
    // want to use it immediately to work out upper limit of passengers.
    const {
        records: allVehicleClasses,
        isLoading: isVehicleClassesLoading,
        error: initialDataError,
    } = useListModel('scbp_core.vehicleclass');
    const currentUser = useCurrentUser();
    const activeAccount = useActiveAccount();
    const { passengerGuest, passenger } = bookingState;
    // If user logs in and we've already initialised we want to default the current
    // passenger to that user. This allows them to login on the final step and book
    // without having to come back to first step and select passenger.
    useEffect(() => {
        if (currentUser && !passengerGuest && !passenger) {
            setBookingState(state => ({ ...state, passenger: currentUser.id }));
        }
    }, [currentUser, passenger, passengerGuest, setBookingState]);
    const { response, isLoading: isSubmitting, run: runValidation } = useAsyncRedux(
        validateBookingStep
    );

    const { travelOnDate, travelOnTime } = bookingState;

    const { response: priceOptions, isLoading: isPriceOptionsLoading } = useAsyncRedux(
        loadPriceOptions,
        {
            trigger: useAsyncRedux.SHALLOW,
            args: [travelOnDate, travelOnTime],
        }
    );

    const { isLoading: isFinalSubmissionLoading, run: runCompleteBooking } = useAsyncRedux(
        existingBooking ? updateBooking : saveBooking
    );
    const lastValidResponse = useRef(null);
    if (response) {
        lastValidResponse.current = response;
    }
    // On mount if we aren't on the first step we want to validate the current data
    // to either identify errors or if valid get the current price details. We know this
    // has happened once we have a response.
    const initialValidationComplete = currentStep.isFirst() || lastValidResponse.current;
    // For validation purposes when page is first loaded we validated the step before; all
    // we want to know is if they are allowed onto this step (not if this step is already
    // valid - that happens when they submit)
    const stepForInitialValidation = currentStep.getPrevious() || steps.first();
    const validateStep = useCallback(
        data => {
            setFurthestStepAvailable(null);
            return runValidation(
                data,
                // On initial validation we want to check the step before... if that's valid
                // we are allowed on this step. For other calls we are validating the current
                // step is valid.
                initialValidationComplete
                    ? currentStep.getStepIndex()
                    : stepForInitialValidation.getStepIndex()
            ).then(null, error => {
                // On error extract the furthestStepIndexAvailable error as it's not
                // a real error we want to display. Set that to local state and throw
                // error for handling by form.
                if (error.response) {
                    const { furthestStepIndexAvailable, ...errors } = error.response;
                    setFurthestStepAvailable(steps.get(furthestStepIndexAvailable, steps.first()));
                    error.response = errors;
                }
                // If we are doing initial validation we don't want to show any form validation; it's just to
                // verify which step they are allowed up to
                if (initialValidationComplete) {
                    handleErrorResponse(error);
                }
            });
        },
        [currentStep, initialValidationComplete, runValidation, stepForInitialValidation]
    );
    const activeAccountId = activeAccount && activeAccount.id;
    const completeBooking = useCallback(
        data => {
            const actionArgs = [
                {
                    ...data,
                    account: activeAccountId,
                    bookingMethod: token ? BookingMethod.APP.value : BookingMethod.WEBSITE.value,
                },
            ];
            if (existingBooking) {
                actionArgs.unshift(existingBooking);
            }
            return runCompleteBooking(...actionArgs).then(
                r => {
                    setCompletedBooking(
                        new WriteOnlyBooking(r.entities['scbp_core.writeonlybooking'][r.result])
                    );
                    setReverseBooking({
                        ...bookingState,
                        travelOnDate: null,
                        travelOnTime: null,
                        fromAddress: bookingState.destinationAddress,
                        fromAddressType: bookingState.destinationAddressType,
                        destinationAddress: bookingState.fromAddress,
                        destinationAddressType: bookingState.fromAddressType,
                        additionalStops: (bookingState.additionalStops || []).reverse(),
                    });
                    return r;
                },
                error => {
                    if (error.response) {
                        const { furthestStepIndexAvailable, ...errors } = error.response;
                        // setFurthestStepAvailable(steps.get(furthestStepIndexAvailable, steps.first()));
                        error.response = errors;
                    }
                    handleErrorResponse(error);
                }
            );
        },
        [activeAccountId, token, existingBooking, runCompleteBooking, bookingState]
    );
    useEffect(() => {
        if (existingBooking || !currentStep.isFirst()) {
            validateStep(bookingState);
        }
        // We only want this effect to run the first time.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set the account if not previously set
    if (activeAccountId) {
        bookingState.account = activeAccountId;
    }

    const bookingContext = {
        data: bookingState,
        priceOptions,
    };

    let accessibleSteps = [steps.first()];

    if (!isVehicleClassesLoading && !initialDataError) {
        const vehicleClass = allVehicleClasses.find(v => v.getId() === bookingState.vehicleClassId);
        const passengerCountLimit = allVehicleClasses.map(v => v.maxPassengerCount).max();
        const baggageCountLimit = allVehicleClasses.map(v => v.maxBaggageCount).max();
        // This is the valid classes based on selected passenger count and interstate status
        const vehicleClasses = allVehicleClasses.filter(
            v =>
                v.isInterstate ===
                    (lastValidResponse.current && lastValidResponse.current.isInterstate) &&
                v.maxPassengerCount >= (bookingState.passengerCount || 1) &&
                v.maxBaggageCount >= (bookingState.baggageCount || 1)
        );
        const defaultVehicleClass =
            // This might not exist if doesn't meet passenger count requirement
            vehicleClasses.find(vc => vc.isAnyClass) || vehicleClasses.first();
        Object.assign(bookingContext, {
            defaultVehicleClass,
            vehicleClass,
            vehicleClasses,
            passengerCountLimit,
            baggageCountLimit,
        });

        // Calculate what steps can be accessed. If previous steps aren't accessible we don't
        // allow access to to a step even if it otherwise would be.
        for (const step of steps.skip(1)) {
            if (step.isLast()) {
                continue;
            }
            const data = pick(bookingState, step.dataKeys.toArray());
            const isValid = Object.values(step.validate(data, bookingContext)).reduce(
                (valid, value) => valid && !value,
                true
            );
            accessibleSteps.push(step);
            if (!isValid) {
                break;
            }
        }
    }

    if (completedBooking) {
        accessibleSteps = [steps.last()];
    }

    if (lastValidResponse.current) {
        bookingContext.vehicleClassPrices = lastValidResponse.current.vehicleClassPrices;
        bookingContext.currentPrice =
            bookingContext.vehicleClassPrices[
                bookingContext.vehicleClass && bookingContext.vehicleClass.getId()
            ];
        bookingContext.isInterstate = lastValidResponse.current.isInterstate;
        bookingContext.isHourlyOutOfArea = lastValidResponse.current.isHourlyOutOfArea;
        if (!bookingContext.currentPrice && bookingContext.defaultVehicleClasses) {
            bookingContext.currentPrice =
                bookingContext.vehicleClassPrices[bookingContext.defaultVehicleClass.getId()];
        }
    }
    function bookReturnTrip() {
        setCreateBookingState(reverseBookingState);
        setCompletedBooking(null);
    }

    return {
        // This contains response data from backend, eg.
        // vehicleClassPrices
        ...response,
        // Wait for initial data to load and for initial validation to pass. This ensures we always
        // have a price after step 1.
        isInitialDataLoading:
            isPriceOptionsLoading || isVehicleClassesLoading || !initialValidationComplete,
        initialDataError,
        isSubmitting: isSubmitting || isFinalSubmissionLoading,
        validateStep,
        furthestStepAvailable: furthestStepAvailable || currentStep,
        bookingContext,
        accessibleSteps,
        completeBooking,
        bookReturnTrip,
        setBookingState,
        bookingState,
        completedBooking,
        clearBookingState: () => {
            setBookingState({});
            setCompletedBooking(null);
        },
    };
}
