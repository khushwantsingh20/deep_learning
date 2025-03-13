import PropTypes from 'prop-types';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import React, { useContext, useMemo } from 'react';

const adminBookingContext = React.createContext();

/**
 * Provide context within BookingCreateUpdateView. This exists to make it easy to pass Booking
 * down deeply primarily for BookingValueWidget so it can determine when to make fields read
 * only based on status of booking.
 * @param booking
 * @param children
 * @returns {*}
 * @constructor
 */
export function AdminBookingContext({ booking, missingPriceFields, children }) {
    const context = useMemo(() => ({ booking, missingPriceFields }), [booking, missingPriceFields]);
    return <adminBookingContext.Provider value={context}>{children}</adminBookingContext.Provider>;
}

AdminBookingContext.propTypes = {
    /** List of fields required before a price estimate can be done */
    missingPriceFields: PropTypes.arrayOf(PropTypes.string).isRequired,
    /** If performing an update this should be the booking being updated */
    booking: modelInstance('scbp_core.booking'),
};

export function useAdminBooking() {
    return useContext(adminBookingContext);
}
