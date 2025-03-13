import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import { appendToUrl } from '@alliance-software/djrad/util/url';
import { Skeleton } from 'antd';
import React from 'react';
import { Route, Switch } from 'react-router';
import PageNotFound from '../../../common/errors/PageNotFound';
import { AccountToClient } from '../models';
import ClientAddressView from './ClientAddressView';

export default function AccountToClientDetailRoutes({ match }) {
    const { id: accountToClientId } = match.params;
    const { record: accountToClient, isLoading, error } = useGetModel(
        AccountToClient,
        accountToClientId
    );

    if (error) {
        throw error;
    }

    if (isLoading) {
        return <Skeleton />;
    }
    return (
        <Switch>
            <Route
                path={appendToUrl(match.url, 'detail')}
                exact
                render={routeProps => <ClientAddressView {...routeProps} user={accountToClient} />}
            />
            <Route component={PageNotFound} />
        </Switch>
    );
}
