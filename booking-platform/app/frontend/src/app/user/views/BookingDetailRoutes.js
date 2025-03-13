import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import { appendToUrl } from '@alliance-software/djrad/util/url';
import React from 'react';
import { Route, Switch } from 'react-router';
import PageNotFound from '../../../common/errors/PageNotFound';
import FullPageLoading from '../../../common/misc/FullPageLoading';
import ClientBookingDetailView from '../components/ClientBookingDetailView';
import { Booking } from '../models';
import ClientBookingCancelView from './ClientBookingCancelView';

export default function BookingDetailRoutes({ match }) {
    const { record, isLoading, error } = useGetModel(Booking, match.params.id);

    if (error) {
        throw error;
    }

    if (isLoading) return <FullPageLoading />;
    return (
        <Switch>
            <Route
                path={appendToUrl(match.url, 'detail')}
                exact
                render={routeProps => <ClientBookingDetailView {...routeProps} record={record} />}
            />
            <Route
                path={appendToUrl(match.url, 'cancel')}
                exact
                render={routeProps => <ClientBookingCancelView {...routeProps} record={record} />}
            />
            {/* We don't do update here - it's added as a sibling to BookingDetailRoutes as it fetches data
            from a special endpoint specifically for updates */}
            <Route component={PageNotFound} />
        </Switch>
    );
}
