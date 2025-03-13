import { useEffect, useState } from 'react';

const SESSION_STORAGE_KEY = 'bookingData';
function getInitialData() {
    try {
        return JSON.parse(window.sessionStorage.getItem(SESSION_STORAGE_KEY) || '{}') || {};
    } catch (e) {
        // Ignore invalid data, start fresh
        return {};
    }
}

export function persistBookingState(state) {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
}

/**
 * Hook to load booking state from session storage and write it out whenever it changes
 *
 * Wraps useState and has same interface.
 */
export default function useCreateBookingState() {
    const [bookingState, setBookingState] = useState(getInitialData);

    useEffect(() => {
        // Whenever booking state changes write it to session storage
        persistBookingState(bookingState);
    }, [bookingState]);

    return [bookingState, setBookingState];
}
