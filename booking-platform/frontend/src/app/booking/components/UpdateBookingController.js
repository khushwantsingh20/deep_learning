import useElementFocus from '@alliance-software/djrad/hooks/useElementFocus';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { notification } from 'antd';
import pick from 'lodash/pick';
import { appendToUrl } from '@alliance-software/djrad/util/url';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { Redirect } from 'react-router';
import { useSelector } from 'react-redux';
import useBreakpoint from '../../../common/hooks/useBreakpoint';
import BookingSteps from '../../../common/ui/BookingSteps';
import { persistBookingState } from '../hooks/useCreateBookingState';
import useCreateUpdateBookingNavigation from '../hooks/useCreateUpdateBookingNavigation';
import useCreateUpdateBookingController from '../hooks/useCreateUpdateBookingController';
import { WriteOnlyBooking } from '../models';
import steps, { BookingStep } from '../steps';
import { User } from '../../user/models';

import styles from './CreateBookingController.less';
import UpdateBookingButtonBar from './UpdateBookingButtonBar';

/**
 * For the specified step return that initial values required for that step from
 * the current booking state or default values if not set.
 */
function getFormInitialValues(step, bookingContext) {
    const { data: bookingState, defaultVehicleClass } = bookingContext;
    const data = pick(bookingState, step.dataKeys.toArray());
    for (const entry of step.defaultValues.entrySeq()) {
        const [key, value] = entry;
        if (data[key] === undefined) {
            data[key] = value;
        }
    }
    if (step.dataKeys.includes('vehicleClassId') && !data.vehicleClassId && defaultVehicleClass) {
        data.vehicleClassId = defaultVehicleClass.getId();
    }
    return data;
}

export default function UpdateBookingController({ currentStep, baseUrl, booking }) {
    const [bookingState, setBookingState] = useState(() => {
        const initialData = booking.toJS();
        // Without this date is a moment and ends up being converted to a string without
        // proper timezone information and is wrong. I think this is probably a bug in
        // how djrad handles DateField.
        initialData.travelOnDate = booking.travelOnDate.format('YYYY-MM-DD');
        const fixAddress = address => {
            if (address) {
                address.isValidAddress = true;
            }
            return address;
        };
        fixAddress(initialData.fromAddress);
        fixAddress(initialData.destinationAddress);
        // additionalStops are of form:
        // {
        //    address: { ...address details... },
        //    isPickUp: true,
        // }
        // We deal with them as a flat structure though to make using existing address
        // widgets easier.
        initialData.additionalStops = initialData.additionalStops.map(({ isPickUp, address }) => ({
            isPickUp,
            ...fixAddress(address),
        }));
        return initialData;
    });

    const {
        bookReturnTrip,
        accessibleSteps,
        bookingContext,
        furthestStepAvailable,
        validateStep,
        completeBooking,
        initialDataError,
        isInitialDataLoading,
        clearBookingState,
        completedBooking,
    } = useCreateUpdateBookingController(
        currentStep,
        // For return trips we just save the return trip data to local storage with
        // persistBookingState - useCreateBookingState will then load it when the user
        // is redirected to the booking creation page.
        [bookingState, setBookingState, persistBookingState],
        booking
    );

    const { goToStep, goNext, goPrevious } = useCreateUpdateBookingNavigation({
        baseUrl,
        currentStep,
        furthestStepAvailable,
    });

    const { isMobile } = useBreakpoint();

    // When form has submitted and there's errors, scroll to error
    const focusError = useElementFocus(false, { containerSelector: '.has-error' });

    const loggedInUser = useSelector(User.selectors.currentUser);
    const saveStep = useCallback(
        ({ _submitAction, goToNext = true, ignoreErrors = false, ...data }) => {
            const finalData = { ...pick(data, currentStep.dataKeys.toArray()), goToNext };
            const extraKeys = Object.keys(data).filter(key => !(key in finalData));
            if (extraKeys.length) {
                // eslint-disable-next-line no-console
                console.warn(
                    `Extra keys in data: ${extraKeys.join(
                        ', '
                    )}. This data has been ignored. Add these to 'dataKeys' on the step ${
                        currentStep.name
                    }`
                );
            }
            const nextState = {
                ...bookingState,
                ...finalData,
            };
            if (currentStep.isCompleteBookingStep()) {
                return completeBooking(nextState).then(() => {
                    goNext();
                    setBookingState({});
                });
            }
            return validateStep(nextState, currentStep)
                .then(() => {
                    setBookingState(nextState);
                    goToNext && goNext();
                })
                .catch(error => {
                    // For recalculating price for additional stops we ignore errors
                    // such as validation on additional stops themselves
                    if (!ignoreErrors) {
                        throw error;
                    }
                });
        },
        [currentStep, bookingState, validateStep, completeBooking, setBookingState, goNext]
    );
    if (isInitialDataLoading) {
        return null;
    }
    if (initialDataError) {
        // eslint-disable-next-line no-console
        console.error(initialDataError);
        return <p>There was an unexpected error. Please refresh the page to try again.</p>;
    }
    // If current step isn't accessible we redirect to last accessible step.
    if (!accessibleSteps.includes(currentStep)) {
        return (
            <Redirect
                to={appendToUrl(baseUrl, accessibleSteps[accessibleSteps.length - 1].urlPart)}
            />
        );
    }

    const stepUrlFriendlyName = currentStep.name.replace(/\s+/g, '-').toLowerCase();

    const beforeErrorRender = errors => {
        const key = 'BookingErrorNotification';
        if (errors) {
            const description = (
                <ul>
                    {errors.map(error => (
                        <li>{error}</li>
                    ))}
                </ul>
            );
            notification.error({
                description,
                duration: 10,
                key,
                message: 'Cannot proceed with booking',
            });
        } else {
            notification.close(key);
        }
    };

    return (
        <React.Fragment>
            {!(currentStep.isLast() && !loggedInUser) && !isMobile && (
                <React.Fragment>
                    <div className={styles.steps}>
                        <BookingSteps
                            goToStep={goToStep}
                            accessibleSteps={accessibleSteps}
                            steps={steps}
                            current={currentStep}
                            labelPlacement="vertical"
                        />
                    </div>
                </React.Fragment>
            )}
            <div
                data-testid="booking-container"
                className={`container step-${stepUrlFriendlyName}`}
            >
                {React.createElement(currentStep.component, {
                    onSubmitFail: focusError,
                    onSubmit: saveStep,
                    validate: data => currentStep.validate(data, bookingContext),
                    name: currentStep.getFormName(),
                    initialValues: getFormInitialValues(currentStep, bookingContext),
                    headerBar: (
                        <UpdateBookingButtonBar
                            header={currentStep.name}
                            {...{ currentStep, goPrevious }}
                        />
                    ),
                    footer: (
                        <UpdateBookingButtonBar
                            {...{ currentStep, goPrevious }}
                            currentUser={loggedInUser}
                        />
                    ),
                    model: WriteOnlyBooking,
                    beforeErrorRender,
                    bookingContext,
                    clearBookingState,
                    bookReturnTrip,
                    steps,
                    goToStep,
                    completedBooking,
                })}
            </div>
        </React.Fragment>
    );
}

UpdateBookingController.propTypes = {
    booking: modelInstance('scbp_core.booking').isRequired,
    baseUrl: PropTypes.string.isRequired,
    currentStep: PropTypes.instanceOf(BookingStep).isRequired,
};
