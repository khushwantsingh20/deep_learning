import React from 'react';

import useUnverifiedBookings from '../../booking/hooks/useUnverifiedBookings';

import styles from '../dispatch.less';

export default function useUnverifiedBadge() {
    const { records: unverifiedBookings } = useUnverifiedBookings();
    const unverifiedCount = unverifiedBookings.size;
    return (
        <div>
            <span>Unverified</span>
            <div className={styles.unverifiedCount}>{unverifiedCount}</div>
        </div>
    );
}
