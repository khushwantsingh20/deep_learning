import { Alert } from 'antd';
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import LoginForm from '../../../common/auth/components/LoginForm';
import styles from './LoginView.less';

export default function LoginView({ history }) {
    return (
        <div className={styles.loginPage}>
            <Helmet>
                <title>Login | Limomate by Southern Cross</title>
                <meta
                    name="description"
                    content="Limomate specialises in Chauffeur Cars, Limousines, and Airport Transfers Melbourne wide. Contact us today for further information."
                />
                <meta
                    name="keywords"
                    content="limomate, login, limomate app, about drivers, about cars, about us, limousine service Melbourne, Southern cross, southern cross vha, vha, chauffeur driven cars Melbourne, luxury chauffeur Melbourne, private chauffeur Melbourne, chauffeur cars Melbourne airport"
                />
            </Helmet>
            <Alert
                message="Dear Valued Clients"
                description={
                    <span>
                        We updated our website on 1st March 2020. Existing clients will need to{' '}
                        <Link to="/request-password-reset/">update their password</Link> before
                        making a booking.
                    </span>
                }
                type="warning"
            />
            <br />
            <h2>Login</h2>
            <LoginForm onSuccess={() => history.push('/')} />
        </div>
    );
}
