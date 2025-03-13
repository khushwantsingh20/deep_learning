import { Tag } from 'antd';
import React from 'react';
import useUnverifiedBookings from '../hooks/useUnverifiedBookings';

/**
 * Render the unverified bookings title with a count on the number of records
 *
 * NOTE: The fetching of data is done in polling call to useUnverifiedBookings in
 * AuthenticatedAdminRootView
 */
export default function UnverifiedBookingMenuTitle() {
    const { records } = useUnverifiedBookings();
    return (
        <>
            Unverified&nbsp;
            <Tag color={records.size === 0 ? '#87d068' : '#f50'}>{records.size}</Tag>
        </>
    );
}
