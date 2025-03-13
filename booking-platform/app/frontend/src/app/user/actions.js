import { modelDetailRoute } from '@alliance-software/djrad/actions';
import api, { createRecordFromId } from '../../common/api';
import { AUTH_LOGIN, SET_ACTIVE_ACCOUNT } from '../../core/actionTypes';
import { Account, User } from './models';

export function signup(data) {
    return async dispatch => {
        const response = await api.listRoutePost(User, 'signup', data);
        // User has been logged in on backend so we can mark them logged in on frontend
        dispatch({
            type: AUTH_LOGIN,
            payload: response,
        });
        return response;
    };
}

export function setActiveAccount(accountId) {
    return async dispatch => {
        const record = createRecordFromId(Account, accountId);
        await dispatch(modelDetailRoute('post', record, 'set-active-for-session'));
        dispatch({
            type: SET_ACTIVE_ACCOUNT,
            payload: { accountId },
        });
    };
}
