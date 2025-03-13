import { modelDetailRoute } from '@alliance-software/djrad/actions';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import useActionUrl from '@alliance-software/djrad/hooks/useActionUrl';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import useSettings from '@alliance-software/djrad/hooks/useSettings';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { message, Alert, Button } from 'antd';
import moment from 'moment';
import React, { useCallback } from 'react';
import { Booking } from '../models';

function cancelBooking(booking) {
    return reduxDispatch => {
        return reduxDispatch(modelDetailRoute('post', booking, 'cancel-booking'));
    };
}

function ClientBookingDetailView({ record, history }) {
    const {
        scContactInfo: { officeNumber },
    } = useSettings();
    const { bookingNumber, passengerFullname, travelOn } = record;
    const listUrl = useActionUrl(Booking, 'list');
    const onSuccess = useCallback(() => {
        message.success(`Booking ${bookingNumber} has been cancelled`);
        history.push(listUrl);
    }, [bookingNumber, history, listUrl]);
    const { isLoading, run, error } = useAsyncRedux(() => cancelBooking(record), {
        onSuccess,
    });
    const travelOnMoment = moment(travelOn);
    const travelOnDate = travelOnMoment.format('dddd, Do MMMM YYYY');
    const travelOnTime = travelOnMoment.format('LT');
    return (
        <div className="container">
            <p>
                <ActionLink model={Booking} action="list">
                    &lt; Back to my bookings
                </ActionLink>
            </p>
            <h2>Booking &ndash; {bookingNumber}</h2>
            <h3>
                Booked for: {passengerFullname} to travel on {travelOnDate} at {travelOnTime}
            </h3>
            {!record.isModifiable && (
                <Alert
                    message={`Please call the office on ${officeNumber} to cancel a booking this close to the requested pick up time`}
                    showIcon
                    type="error"
                />
            )}

            {record.isModifiable && (
                <>
                    <Alert
                        message="CONFIRM BOOKING CANCELLATION"
                        description={
                            <>
                                <p>Are you sure you want to cancel this booking?</p>
                                <Button onClick={run} type="danger" loading={isLoading}>
                                    Yes, Cancel this Booking
                                </Button>
                            </>
                        }
                        type="warning"
                        showIcon
                    />

                    {error && !isLoading && (
                        <Alert
                            style={{ marginTop: 20 }}
                            message={`There was a problem cancelling your booking. Please try again or if problems persist call the office on ${officeNumber}`}
                            type="error"
                            showIcon
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default ClientBookingDetailView;

ClientBookingDetailView.propTypes = {
    record: modelInstance('scbp_core.booking'),
};
