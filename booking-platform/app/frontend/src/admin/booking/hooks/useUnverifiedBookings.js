import useListModel from '@alliance-software/djrad/hooks/useListModel';
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { BookingStatus } from '../../../choiceConstants';
import { Booking } from '../models';

const partialRecordFieldNames = [
    'travelOn',
    'bookingAdditionalStops',
    'bookingNumber',
    'clientUser',
    'clientUserFullname',
    'account',
    'fromAddress',
    'destinationAddress',
    'vehicleClass',
    'vehicleClassName',
    'bookingStatus',
    'bookingMethod',
    'bookingType',
    'priceTotal',
    'account__relatedLabel',
];

// Poll every 30 seconds
const POLL_INTERVAL = 30 * 1000;

/**
 * Select unverified bookings.
 *
 * @param poll If true backend is polled for bookings. Only one instance of this should
 * occur in the app (ie. data fetching occurs in one place, everywhere else just uses
 * the fetched data).
 */
export default function useUnverifiedBookings({ poll = false } = {}) {
    const audioRef = useRef();
    const records = useSelector(state => {
        return Booking.selectors.partialFields
            .synced(state)(partialRecordFieldNames)
            .filter(booking =>
                [BookingStatus.UNVERIFIED.value, BookingStatus.CHANGED.value].includes(
                    booking.bookingStatus
                )
            );
    });
    const { isLoading, error, run } = useListModel(
        Booking,
        {
            pageSize: 100,
            // The way this works is we ask the backend to return any records again
            // from last fetch in case any of them have had a status change since
            // that fetch. In addition any bookings with unverified status are also
            // returned.
            // Explicitly pass `null` when no records so that it forces the filter on
            // the backend to run (this doesn't happen if you pass [])
            unverifiedOrSpecifiedBookings:
                records.size > 0 ? records.map(r => r.id).toArray() : null,
        },
        { trigger: useListModel.MANUAL, partialRecordFieldNames }
    );

    useEffect(() => {
        if (poll) {
            run();
            const intervalId = setInterval(() => {
                run();
            }, POLL_INTERVAL);
            return () => clearInterval(intervalId);
        }
        return () => {};
    }, [poll, run]);

    // Whenever a new record is added we want to play a notification sound.
    // We can't just compare size as a new record could be added at same time
    // one has been verified. Instead we check when records changes for any
    // new id's that didn't exist last time.
    const lastRecordIds = useRef();
    useEffect(() => {
        if (audioRef.current) {
            if (
                lastRecordIds.current &&
                lastRecordIds.current.size > 0 &&
                records
                    .map(record => record.id)
                    .toSet()
                    .subtract(lastRecordIds.current).size > 0
            ) {
                try {
                    audioRef.current.play();
                } catch (e) {
                    // do nothing. this's to get around https://goo.gl/xX8pDD
                }
            }
        }
        lastRecordIds.current = records.map(record => record.id).toSet();
    }, [records]);

    // Notification is only used in from the main polling component
    let notificationElement = null;
    if (poll) {
        notificationElement = (
            <audio controls="" ref={audioRef}>
                <source src="/assets/new-booking-notification.mp3" />
            </audio>
        );
    }

    return { isLoading, records, error, notificationElement };
}
