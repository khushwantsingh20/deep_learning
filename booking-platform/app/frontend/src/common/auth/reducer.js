import { actionTypes } from 'alliance-redux-api/lib/actions';
import { Record, Maybe } from 'typed-immutable';
import createReducer from '@alliance-software/djrad/util/createReducer';
import { API_CALL_AUTH_REQUIRED } from '@alliance-software/djrad/api';

import { AUTH_LOGIN, SET_ACTIVE_ACCOUNT } from '../../core/actionTypes';

const AuthState = Record({
    sessionExpired: Boolean(false),
    isLoggedIn: Boolean(false),
    userId: Maybe(Number),
    isHijackedUser: Boolean(false),
    // Currently active Account - only applicable to app site not admin
    activeAccountId: Maybe(Number),
});

export const authSelectors = {
    authState(state) {
        return state.Auth;
    },
    currentUserId(state) {
        return authSelectors.authState(state).userId;
    },
    isHijackedUser(state) {
        return authSelectors.authState(state).isHijackedUser;
    },
    activeAccountId(state) {
        return authSelectors.authState(state).activeAccountId;
    },
};

export default createReducer(AuthState, {
    [SET_ACTIVE_ACCOUNT]: (state, action) => {
        const { accountId } = action.payload;
        return state.set('activeAccountId', accountId);
    },
    [actionTypes.add]: (state, action) => {
        // When first account is added set it to our active account. This happens on backend
        // and usually we know about this from initial page load... not for the first account
        // added however.
        if (action.meta.stateKey === 'scbp_core.account' && !state.activeAccountId) {
            return state.set('activeAccountId', action.payload.result);
        }
        return state;
    },
    [AUTH_LOGIN](state, { payload }) {
        let activeAccountId = null;
        if (payload.activeAccount) {
            activeAccountId = payload.activeAccount.id;
        }
        return state.merge({
            isLoggedIn: true,
            sessionExpired: false,
            // We just store the user id - the user details are stored in the
            // User part of the redux state tree. See app/user/models.js
            userId: payload.user.id,
            // We store the active account id - the full record is stored in the accounts
            // section of redux. See app/user/models.js
            activeAccountId,
        });
    },
    [API_CALL_AUTH_REQUIRED](state) {
        return state.merge({
            sessionExpired: true,
            isLoggedIn: false,
            // NOTE: We specifically don't clear the userId as we show a modal
            // on session expiry. If the userId suddenly disappeared then the
            // components under the modal may not have the expected data and
            // could error out.
        });
    },
});
