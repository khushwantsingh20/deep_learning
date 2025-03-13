import { Col, Row } from 'antd';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { parseLocationQuery } from '@alliance-software/djrad/util/url';
import api from '../../../common/api';
import { User } from '../../user/models';
import ResetPasswordForm from '../components/ResetPasswordForm';
import { AUTH_LOGIN } from '../../../core/actionTypes';

const RESET_STATE = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    ERROR_INVALID: 'ERROR_INVALID',
    ERROR_EXPIRED: 'ERROR_EXPIRED',
};

function loginAfterReset(payload) {
    const { user } = payload;
    return {
        type: AUTH_LOGIN,
        payload: { user },
    };
}

function parseErrorResponse(error) {
    if (error === 'signature expired') {
        return RESET_STATE.ERROR_EXPIRED;
    }
    return RESET_STATE.ERROR_INVALID;
}

export default function PasswordResetView(props) {
    const [activationState, setActivationState] = useState(RESET_STATE.PENDING);
    const dispatch = useDispatch();

    const loginOnSuccess = response => {
        dispatch(loginAfterReset(response));
        props.history.push('/');
    };

    const token = parseLocationQuery(props.location).token;
    useEffect(() => {
        async function validateRequest() {
            try {
                await api.listRoutePost(User, 'validate_password_reset', {
                    token,
                });
                setActivationState(RESET_STATE.SUCCESS);
            } catch (apiError) {
                const { error } = apiError.response;
                const errActivationState = parseErrorResponse(error);
                setActivationState(errActivationState);
            }
        }
        validateRequest();
    }, [token]);

    switch (activationState) {
        case RESET_STATE.SUCCESS:
            return (
                <div className="container">
                    <Row>
                        <Col md={{ span: 16, offset: 4 }} lg={{ span: 14, offset: 5 }}>
                            <h1>Reset your password</h1>
                            <ResetPasswordForm token={token} onSuccess={loginOnSuccess} />
                        </Col>
                    </Row>
                </div>
            );
        case RESET_STATE.ERROR_EXPIRED:
            return (
                <div className="container">
                    <Row>
                        <Col md={{ span: 16, offset: 4 }} lg={{ span: 14, offset: 5 }}>
                            <h1>Reset link expired</h1>
                            <p>
                                Your password reset link has expired. Please{' '}
                                <Link to="/request-password-reset">reset</Link> again to generate a
                                new link.
                            </p>
                        </Col>
                    </Row>
                </div>
            );
        case RESET_STATE.ERROR_INVALID:
            return (
                <div className="container">
                    <Row>
                        <Col md={{ span: 16, offset: 4 }} lg={{ span: 14, offset: 5 }}>
                            <h1>Reset password</h1>
                            <p>
                                There seems to be a problem with your password reset link. Please{' '}
                                <Link to="/request-password-reset">reset</Link> again to generate a
                                new link.
                            </p>
                        </Col>
                    </Row>
                </div>
            );
        case RESET_STATE.PENDING:
        default:
            return <div>Validating reset request...</div>;
    }
}
