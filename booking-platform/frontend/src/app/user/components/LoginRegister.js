import { Alert, Tabs } from 'antd';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import LoginForm from '../../../common/auth/components/LoginForm';
import SignupForm from './SignupForm';
import styles from './LoginRegister.less';

const { TabPane } = Tabs;

function LoginRegister(props) {
    const { onLoginSuccess, onRegisterSuccess } = props;

    const [activeTab, setActiveTab] = useState('login');

    return (
        <div>
            <Tabs type="card" activeKey={activeTab} onChange={t => setActiveTab(t)}>
                <TabPane className={styles.tabpane} tab="Login" key="login">
                    <Alert
                        message="Dear Valued Clients"
                        description={
                            <span>
                                We updated our website on 1st March 2020. Existing clients will need
                                to <Link to="/request-password-reset/">update their password</Link>{' '}
                                before making a booking.
                            </span>
                        }
                        type="warning"
                    />
                    <br />
                    <div className={styles.loginBox}>
                        <p className="h3">Login to your account</p>
                        <LoginForm hideSignupLink onSuccess={onLoginSuccess} />
                        <p>
                            Don&apos;t have an account?{' '}
                            <button
                                className="btn-inline-link"
                                onClick={() => setActiveTab('register')}
                            >
                                Register
                            </button>
                        </p>
                    </div>
                </TabPane>
                <TabPane className={styles.tabpane} tab="Register" key="register">
                    <p className="h3">Register for an account</p>
                    <SignupForm hideLoginLink onSuccess={onRegisterSuccess} />
                </TabPane>
            </Tabs>
        </div>
    );
}

export default LoginRegister;

LoginRegister.propTypes = {
    onLoginSuccess: PropTypes.func,
    onRegisterSuccess: PropTypes.func,
};
