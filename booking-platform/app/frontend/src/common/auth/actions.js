import { post } from 'alliance-redux-api/lib/api';
import { AUTH_LOGIN } from '../../core/actionTypes';

export function login(payload) {
    return async dispatch => {
        const response = await dispatch(post('/login/', payload));
        if (response.error) {
            throw response.payload;
        }
        const { redirectTo, user, ...rest } = response.payload;
        // If wrong user type is logged in for the current site we need to
        // send them to the correct location instead
        if (redirectTo) {
            window.location.href = redirectTo;
            return null;
        }
        dispatch({
            type: AUTH_LOGIN,
            // We always expect 'user' but there may also be additional data
            // passed through from backend - we pass it through as is
            payload: { user, ...rest },
        });
        return response.payload;
    };
}
