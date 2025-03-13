import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import { appendToUrl } from '@alliance-software/djrad/util/url';
import { Alert } from 'antd';
import React from 'react';
import { Route, Switch } from 'react-router';
import PageNotFound from '../../../common/errors/PageNotFound';
import FullPageLoading from '../../../common/misc/FullPageLoading';
import { Booking } from '../../user/models';
import UpdateBookingController from '../components/UpdateBookingController';
import { WriteOnlyBooking } from '../models';
import steps from '../steps';

const stepPattern = steps.map(step => step.urlPart).join('|');
const stepsByUrlPart = steps.reduce((acc, step) => {
    acc[step.urlPart] = step;
    return acc;
}, {});

export default function ClientBookingUpdateView({ match }) {
    const { record, isLoading, error } = useGetModel(WriteOnlyBooking, match.params.id);

    const breadcrumb = (
        <p>
            <ActionLink model={Booking} action="list">
                &lt; Back to my bookings
            </ActionLink>
        </p>
    );

    if (error) {
        if (error.response && error.response.tooCloseToTravelTime) {
            return (
                <>
                    {breadcrumb}
                    <Alert message={error.response.message} showIcon type="error" />
                </>
            );
        }
        throw error;
    }

    if (isLoading) return <FullPageLoading />;

    const { bookingNumber, passengerFullname } = record;

    return (
        <>
            {breadcrumb}
            <h3 style={{ marginBottom: 20 }}>
                Updating booking {bookingNumber} for {passengerFullname}
            </h3>
            <Switch>
                <Route
                    path={appendToUrl(match.url, `:step(${stepPattern})`)}
                    render={routeProps => {
                        const step = stepsByUrlPart[routeProps.match.params.step];
                        return (
                            <UpdateBookingController
                                booking={record}
                                baseUrl={match.url}
                                currentStep={step}
                                {...routeProps}
                            />
                        );
                    }}
                />
                <Route component={PageNotFound} />
            </Switch>
        </>
    );
}
