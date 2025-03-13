import { Col, Row } from 'antd';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route } from 'react-router-dom';
import { appendToUrl } from '@alliance-software/djrad/util/url';
import PasswordResetRequestForm from '../components/PasswordResetRequestForm';

function ResetRequested({ email }) {
    return (
        <div className="container">
            <Row>
                <Col md={{ span: 16, offset: 4 }} lg={{ span: 14, offset: 5 }}>
                    <h1>Check your email</h1>
                    <p>
                        A password reset link has been sent to {email}. Please check your email for
                        this link.
                    </p>
                </Col>
            </Row>
        </div>
    );
}

ResetRequested.propTypes = {
    email: PropTypes.string.isRequired,
};

function RequestReset({ onSuccess }) {
    return (
        <div className="container">
            <Row>
                <Col md={{ span: 16, offset: 4 }} lg={{ span: 14, offset: 5 }}>
                    <h1>Reset your password</h1>
                    <PasswordResetRequestForm onSuccess={onSuccess} />
                </Col>
            </Row>
        </div>
    );
}

RequestReset.propTypes = {
    onSuccess: PropTypes.func.isRequired,
};

export default function PasswordResetRequestView({ match, history }) {
    const [email, setEmail] = useState('');

    const onSuccess = response => {
        setEmail(response.email);
    };

    useEffect(() => {
        if (email && !history.location.pathname.match(/complete\//)) {
            history.push('complete/');
        }
    }, [email, history]);

    return (
        <Switch>
            <Route
                exact
                path={appendToUrl(match.url, 'complete/')}
                render={props => <ResetRequested {...props} email={email} />}
            />
            <Route render={props => <RequestReset {...props} onSuccess={onSuccess} />} />
        </Switch>
    );
}
