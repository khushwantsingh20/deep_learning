import moment from 'moment';

const PRIOR_STATE_KEY = 'priorState';

export default function usePriorState() {
    /**
     * Persists dispatch view filter & last-selected booking state in browser local storage.
     *
     * This is used to restore the dispatch screen to what it was previously, when the user browses away from & back to
     * the screen.
     */
    const rawPriorState = window.localStorage.getItem(PRIOR_STATE_KEY);
    const priorState = rawPriorState ? JSON.parse(rawPriorState) : null;
    const initialSelectedRecordId = priorState ? priorState.selectedRecordId : null;

    const setPriorState = (isInitialLoad, selectedRecordId, filters) => {
        if (!isInitialLoad) {
            const newSettings = JSON.stringify({
                selectedRecordId,
                travelDate_after: filters.travelDate_after,
                travelDate_before: filters.travelDate_before,
                bookingStatus: filters.bookingStatus,
            });
            if (newSettings !== rawPriorState) {
                window.localStorage.setItem(PRIOR_STATE_KEY, newSettings);
            }
        }
    };

    const today = moment().format('YYYY-MM-DD');
    // eslint-disable-next-line camelcase
    const travelDate_after = priorState ? priorState.travelDate_after || today : today;
    // eslint-disable-next-line camelcase
    const travelDate_before = priorState ? priorState.travelDate_before || today : today;
    const bookingStatus = priorState ? priorState.bookingStatus || ['Active'] : ['Active'];
    const initialState = {
        travelDate_after,
        travelDate_before,
        bookingStatus,
        interstate: false,
    };

    return {
        initialSelectedRecordId,
        initialState,
        setPriorState,
    };
}
