import React from 'react';
import { useSelector } from 'react-redux';
import { Route } from 'react-router';
import styles from '../../../app/user/views/LoginView.less';
import { authSelectors } from '../reducer';
import LoginForm from './LoginForm';

function AuthenticatedRoute(props) {
    const authState = useSelector(authSelectors.authState);
    const isLoggedIn = authState.isLoggedIn;

    if (!isLoggedIn) {
        return (
            <div className={styles.loginPage}>
                <h2>Please Login</h2>
                <LoginForm />
            </div>
        );
    }
    return <Route {...props} />;
}

export default AuthenticatedRoute;
