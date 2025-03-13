import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../common/api';
import { User } from '../../user/models';

const ACTIVATION_STATE = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    ERROR_INVALID: 'ERROR_INVALID',
    ERROR_ACTIVE: 'ERROR_ACTIVE',
    ERROR_EXPIRED: 'ERROR_EXPIRED',
};

function parseErrorResponse(error) {
    switch (error) {
        case 'signature expired':
            return ACTIVATION_STATE.ERROR_EXPIRED;
        case 'account active':
            return ACTIVATION_STATE.ERROR_ACTIVE;
        default:
            return ACTIVATION_STATE.ERROR_INVALID;
    }
}

async function activate(token, onStateChange, fetchOptions) {
    try {
        await api.listRoutePost(User, 'activate', { token }, { fetchOptions });
        onStateChange(ACTIVATION_STATE.SUCCESS);
    } catch (apiError) {
        const { error } = apiError.response;
        const activationState = parseErrorResponse(error);
        onStateChange(activationState);
    }
}

export default function UserActivationView(props) {
    const [activationState, setActivationState] = useState(ACTIVATION_STATE.PENDING);
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        activate(props.match.params.token, setActivationState, { signal });
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    switch (activationState) {
        case ACTIVATION_STATE.SUCCESS:
            return (
                <div>
                    Your account is now active. Please <Link to="/">log in</Link>.
                </div>
            );
        case ACTIVATION_STATE.ERROR_EXPIRED:
            return (
                <div>
                    It looks like your activation link has expired. Please{' '}
                    <Link to="/signup">signup</Link> again to generate a new link.
                </div>
            );
        case ACTIVATION_STATE.ERROR_ACTIVE:
            return (
                <div>
                    This account is already active. Please <Link to="/">log in</Link>.
                </div>
            );
        case ACTIVATION_STATE.ERROR_INVALID:
            return (
                <div>
                    Your activation link does not appear to be valid. Please{' '}
                    <Link to="/signup">signup</Link> again to generate a new link.
                </div>
            );
        case ACTIVATION_STATE.PENDING:
        default:
            return <div>Please wait while we activate your account...</div>;
    }
}
