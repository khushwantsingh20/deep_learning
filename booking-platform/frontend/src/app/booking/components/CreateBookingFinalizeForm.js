import { appendToUrl } from '@alliance-software/djrad/util/url';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Icon, Button, Row, Col } from 'antd';
import useRouter from '@alliance-software/djrad/hooks/useRouter';
import DestinationAddressFormatter from '../../../common/components/DestinationAddressFormatter';
import FromAddressFormatter from '../../../common/components/FromAddressFormatter';
import { formatAddress } from '../../../common/formatters/address';
import { useActiveAccount } from '../../user/hooks';
import styles from './CreateBookingController.less';
import { Account, User } from '../../user/models';
import LoginView from '../../user/views/LoginView';

export default function CreateBookingFinalizeForm({
    clearBookingState,
    bookReturnTrip,
    completedBooking,
}) {
    useEffect(() => {
        window.gtag('event', 'conversion', { send_to: 'AW-982077120/scXXCKiRjckBEMCdpdQD' });
    }, []);

    const currentUser = useSelector(User.selectors.currentUser);
    const { history } = useRouter();
    const activeAccount = useActiveAccount();
    const activeAccountId = activeAccount && activeAccount.getId();
    const activeAccountUrl =
        activeAccountId && Account.getActionUrl('detail', { id: activeAccountId });

    if (!currentUser) {
        return <LoginView history={history} />;
    }

    let completedBookingSummary = null;
    if (completedBooking) {
        const travelOnDate = completedBooking.travelOnDate.format('dddd, Do MMMM YYYY');
        const travelOnTime = moment(completedBooking.travelOnTime, ['HH:mm:ss']).format('LT');

        const formattedAdditionalStops = (completedBooking.additionalStops || []).map(stop => (
            <p>
                {stop.isPickUp ? <div>Pick Up at:</div> : ''}
                {stop.address.placeName ? <div>{stop.address.placeName}</div> : ''}
                {formatAddress(stop.address.formattedAddress)}
            </p>
        ));
        completedBookingSummary = (
            <>
                <h2>Your booking summary</h2>
                <div className="textLeft">
                    <Row>
                        <Col md={{ offset: 5 }}>
                            <p>
                                <strong>Booked to travel on:</strong>
                                <br />
                                {travelOnDate} at {travelOnTime}
                            </p>

                            <p>
                                <strong>From:</strong> <br />
                                <FromAddressFormatter booking={completedBooking} />
                            </p>
                            {formattedAdditionalStops.length > 0 && (
                                <>
                                    <strong>Additional stops:</strong>
                                    <br />
                                    {formattedAdditionalStops}
                                </>
                            )}
                            <p>
                                <strong> To:</strong>
                                <br />
                                <DestinationAddressFormatter booking={completedBooking} />
                            </p>
                        </Col>
                    </Row>
                </div>
            </>
        );
    }

    return (
        <div className={`${styles.optionWrapper} textCenter ${styles.finalForm}`}>
            <Icon type="check-circle" theme="filled" className={styles.finalFormIcon} />
            <h1>Your booking is complete</h1>
            <p>Thanks for choosing to travel with Southern Cross, {currentUser.firstName}</p>

            <div className={styles.returnTrip}>
                <h2>Need to book a return trip?</h2>
                <p>Plan ahead and avoid late night booking difficulties.</p>
                <p>
                    <Button
                        onClick={() => {
                            bookReturnTrip();
                            // Delay history push to avoid race condition in setting state
                            // and loading it again on booking form (only happened when
                            // booking reverse trip from a booking update)
                            setTimeout(() => history.push('/'));
                        }}
                    >
                        Book your return trip
                    </Button>
                </p>
            </div>

            {completedBookingSummary}

            <div className={styles.finalFormButtons}>
                {activeAccount && (
                    <>
                        <Button href={`/app` + appendToUrl(activeAccountUrl, 'bookings')}>
                            View my bookings
                        </Button>{' '}
                    </>
                )}

                <Button
                    type="primary"
                    onClick={() => {
                        clearBookingState();
                        history.push('/');
                    }}
                >
                    Book another trip
                </Button>
            </div>
        </div>
    );
}

CreateBookingFinalizeForm.propTypes = {
    clearBookingState: PropTypes.func.isRequired,
    bookReturnTrip: PropTypes.func.isRequired,
    completedBooking: PropTypes.object.isRequired,
};
