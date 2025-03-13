import React, { Suspense } from 'react';
import { injectEventListeners } from 'alliance-react';
import { hot } from 'react-hot-loader/root';
import { useSelector } from 'react-redux';

import { User } from '../user/models';
import { authSelectors } from '../../common/auth/reducer';
import FullPageLoading from '../../common/misc/FullPageLoading';

import UnauthenticatedAdminRootView from './UnauthenticatedAdminRootView';

const AuthenticatedAdminRootView = React.lazy(() => import('./AuthenticatedAdminRootView'));

function AdminRootView(props) {
    const authState = useSelector(authSelectors.authState);
    const currentUser = useSelector(User.selectors.currentUser);
    const isLoggedIn = authState.isLoggedIn;
    const sessionExpired = authState.sessionExpired;
    const { eventListeners, ...rest } = props;
    return (
        <Suspense
            fallback={
                <FullPageLoading>
                    <h2>Loading...</h2>
                </FullPageLoading>
            }
        >
            <div {...eventListeners}>
                {!isLoggedIn && !currentUser ? (
                    <UnauthenticatedAdminRootView
                        isLoggedIn={isLoggedIn}
                        sessionExpired={sessionExpired}
                    />
                ) : (
                    <AuthenticatedAdminRootView
                        currentUser={currentUser}
                        sessionExpired={sessionExpired}
                        {...rest}
                    />
                )}
            </div>
        </Suspense>
    );
}

export default hot(injectEventListeners()(AdminRootView));
