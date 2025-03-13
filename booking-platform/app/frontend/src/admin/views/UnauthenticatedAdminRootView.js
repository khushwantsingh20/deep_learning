import React from 'react';
import { Route, Switch } from 'react-router';
import PasswordResetRequestView from '../user/views/PasswordResetRequestView';
import PasswordResetView from '../user/views/PasswordResetView';

import LoginForm from '../../common/auth/components/LoginForm';

import styles from './UnauthenticatedAdminRootView.less';

/**
 * Base view for unauthenticated users
 */
export default function UnauthenticatedAdminRootView() {
    return (
        <div className="wrapper">
            <div id="content" className="content" tabIndex="-1">
                <main id="main" className="main">
                    <Switch>
                        <Route
                            path="/request-password-reset/"
                            component={PasswordResetRequestView}
                        />
                        <Route path="/reset-password/" exact component={PasswordResetView} />
                        <Route>
                            <div className={styles.loginPage}>
                                <h2>Please login to continue</h2>
                                <LoginForm hideSignupLink />
                            </div>
                        </Route>
                    </Switch>
                </main>
            </div>
        </div>
    );
}
