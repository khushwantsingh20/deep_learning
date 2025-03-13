import useRouter from '@alliance-software/djrad/hooks/useRouter';
import { appendToUrl } from '@alliance-software/djrad/util/url';
import { useCallback, useEffect } from 'react';

/**
 * Returns functions for navigating booking creation steps.
 *
 * Enforces that current step is equal to or before `furthestStepAvailable`
 * @param baseUrl
 * @param currentStep
 * @param furthestStepAvailable
 * @returns {{goToStep: *, goPrevious: *, goNext: *}}
 */
export default function useCreateUpdateBookingNavigation({
    baseUrl,
    currentStep,
    furthestStepAvailable,
}) {
    const { history } = useRouter();

    const goToStep = useCallback(
        step => {
            history.push(appendToUrl(baseUrl, step.urlPart));
            window.scrollTo(0, 0);
        },
        [baseUrl, history]
    );
    const goPrevious = useCallback(() => {
        if (!currentStep.isFirst()) {
            goToStep(currentStep.getPrevious());
        }
    }, [currentStep, goToStep]);

    const goNext = useCallback(() => {
        if (!currentStep.isLast()) {
            goToStep(currentStep.getNext());
        }
    }, [currentStep, goToStep]);

    // Enforce from backend that we can't get to invalid step. This is returned
    // as part of error in validateStep. This would typically only happen if
    // you had some booking data in your session and came back some time later
    // and it was no longer valid on the backend. It could also happen if you got
    // to the last step for example and then some time based validation failed (eg.
    // no longer within minimum time before pickup time)
    useEffect(() => {
        if (furthestStepAvailable.getStepIndex() < currentStep.getStepIndex()) {
            goToStep(furthestStepAvailable);
        }
    }, [currentStep, furthestStepAvailable, goToStep]);

    return { goNext, goToStep, goPrevious };
}
