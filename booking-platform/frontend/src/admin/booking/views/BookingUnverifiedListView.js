import { Skeleton } from 'antd';
import React from 'react';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import ScbpListTableView from '../../../common/data/ScbpListTableView';
import AdminPageHeader from '../../components/AdminPageHeader';
import useUnverifiedBookings from '../hooks/useUnverifiedBookings';
import { Booking } from '../models';
import { bookingListColumns } from './BookingListView';
import { BookingStatus } from '../../../choiceConstants';
import { formatAuCurrency } from '../../../common/formatters/numeric';

/**
 * NOTE: The fetching of data is done in polling call to useUnverifiedBookings in
 * AuthenticatedAdminRootView
 */
function BookingUnverifiedListView() {
    const { records, isLoading, error } = useUnverifiedBookings();
    if (error) {
        throw error;
    }

    const isInitialLoad = isLoading && !records;

    const columns = [
        ...bookingListColumns.slice(0, -3),
        {
            dataIndex: 'bookingStatus',
            title: 'Unverified Reason',
            width: 100,
            render(value) {
                return value === BookingStatus.UNVERIFIED.value ? 'New' : 'Updated';
            },
        },
        ...bookingListColumns.slice(-2, -1),
        {
            dataIndex: 'priceTotal',
            title: 'Total',
            className: 'alignRight',
            render(value) {
                return formatAuCurrency(value);
            },
        },
        ...bookingListColumns.slice(-1),
    ];

    return (
        <>
            <AdminPageHeader htmlTitle="Unverified Bookings" header="Unverified Bookings" />

            {isInitialLoad && <Skeleton />}
            {!isInitialLoad && (
                <ScbpListTableView
                    pagination={false}
                    model={Booking}
                    data={records}
                    columns={columns}
                />
            )}
        </>
    );
}

export default requirePermissions({ action: 'listUnverified', model: Booking })(
    BookingUnverifiedListView
);
