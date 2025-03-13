import { injectEventListeners } from 'alliance-react';
import React, { Suspense } from 'react';
import { hot } from 'react-hot-loader/root';
import { Route, Switch } from 'react-router';

import DriverBookingView from '../components/DriverBookingView';
import ApiErrorBoundary from '../../common/errors/ApiErrorBoundary';
import FullPageLoading from '../../common/misc/FullPageLoading';

import { ReactComponent as Logo } from '../../images/limomate-logo-horizontal-colour.svg';
import styles from '../components/DriverBookingView.less';

function DriverRootView({ eventListeners }) {
    return (
        <Suspense
            fallback={
                <FullPageLoading>
                    <h2>Loading...</h2>
                </FullPageLoading>
            }
        >
            <div {...eventListeners}>
                <ApiErrorBoundary>
                    <div className={styles.header}>
                        <Logo height="50" />
                    </div>
                    <Switch>
                        <Route path="/:token/" component={DriverBookingView} />
                        <Route />
                    </Switch>
                </ApiErrorBoundary>
            </div>
        </Suspense>
    );
}

export default hot(injectEventListeners()(DriverRootView));
