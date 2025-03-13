import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import React from 'react';
import moment from 'moment';
import AdminPageHeader from '../components/AdminPageHeader';

import styles from './AdminDashboardView.less';

function AdminDashboardView() {
    const today = moment().format('YYYY-MM-DD');
    const tomorrow = moment()
        .add(1, 'days')
        .format('YYYY-MM-DD');
    const dayAfterTomorrow = moment()
        .add(2, 'days')
        .format('YYYY-MM-DD');

    return (
        <div>
            <AdminPageHeader header="Dashboard" />
            <h2>Quick links</h2>
            <div className={styles.btnwrapper}>
                <ButtonLink
                    to={`/dispatch/?bookingStatus[0]=Active&travelDate_after=${today}&travelDate_before=${today}&_submitAction=&page=1&ordering=travelOn`}
                    size="large"
                    type="primary"
                    target="_blank"
                    icon="car"
                    shape="round"
                >
                    Dispatch <span className={styles.btnDesc}>(by time)</span>
                </ButtonLink>
                <ButtonLink
                    to={`/dispatch/?bookingStatus[0]=All&travelDate_after=${today}&travelDate_before=${today}&_submitAction=&page=1&ordering=driverNumber`}
                    size="large"
                    type="primary"
                    target="_blank"
                    icon="car"
                    shape="round"
                >
                    Dispatch <span className={styles.btnDesc}>(today)</span>
                </ButtonLink>
                <ButtonLink
                    to={`/dispatch/?bookingStatus[0]=All&travelDate_after=${tomorrow}&travelDate_before=${tomorrow}&_submitAction=&page=1&ordering=travelOn`}
                    size="large"
                    type="primary"
                    target="_blank"
                    icon="car"
                    shape="round"
                >
                    Dispatch <span className={styles.btnDesc}>(tomorrow)</span>
                </ButtonLink>
                <ButtonLink
                    to="/bookings/create/"
                    size="large"
                    type="primary"
                    target="_blank"
                    icon="book"
                    shape="round"
                >
                    Create new booking
                </ButtonLink>
                <ButtonLink
                    to={`/dispatch/?bookingStatus[0]=All&travelDate_after=${dayAfterTomorrow}&travelDate_before=${dayAfterTomorrow}&_submitAction=&page=1&ordering=travelOn`}
                    size="large"
                    type="primary"
                    target="_blank"
                    icon="car"
                    shape="round"
                >
                    Dispatch <span className={styles.btnDesc}>(day after tomorrow)</span>
                </ButtonLink>
            </div>
        </div>
    );
}

export default AdminDashboardView;
