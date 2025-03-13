import moment from 'moment';
import { useEffect, useRef } from 'react';
import useAsync from '@alliance-software/djrad/hooks/useAsync';
import api from '../../../common/api';
import { Booking } from '../models';

// Poll every 20 minutes
const POLL_INTERVAL = 20 * 60;

export default function useBookingIntensity() {
    // we'll access a customized endpoint here. since this page's on a freq poll and will access a large number of bookings,
    // AND does not really care about detail of any of those booking, bypassing serializer should give us a noticable performance boost.
    const { run, isLoading, response } = useAsync(api.listRouteGet);

    const refreshTimer = useRef();
    const dayFrom = useRef();
    const remainingTimer = POLL_INTERVAL - refreshTimer.current;
    const refresh = () => {
        refreshTimer.current = POLL_INTERVAL;
    };
    const setDayFrom = v => {
        if (v) {
            dayFrom.current = v;
            refresh();
        }
    };

    useEffect(() => {
        dayFrom.current = new moment();
        refreshTimer.current = 0;

        run(Booking, 'list-intensity', { from: dayFrom.current.startOf('day').unix() });
        const timer = setInterval(() => {
            if (refreshTimer.current >= POLL_INTERVAL) {
                refreshTimer.current = 0;
                run(Booking, 'list-intensity', { from: dayFrom.current.startOf('day').unix() });
            } else {
                refreshTimer.current += 1;
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [run]);

    return {
        isLoading,
        response,
        refreshTimer: refreshTimer.current,
        remainingTimer,
        refresh,
        setDayFrom,
        dayFrom: dayFrom.current,
    };
}
