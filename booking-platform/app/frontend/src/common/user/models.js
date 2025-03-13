import { createModelReducer } from 'alliance-redux-api';
import { createSelector } from 'reselect';
import { authSelectors } from '../../common/auth/reducer';
import { AUTH_LOGIN } from '../../core/actionTypes';

import ScbpModel from '../../core/model';

export class User extends ScbpModel {
    static getUrlPrefix() {
        return '/users/';
    }

    getInitials(emptyInitials = '') {
        const names = [this.firstName, this.lastName].filter(Boolean);
        return names.map(name => name[0]).join('') || emptyInitials;
    }
}

export class ClientUser extends ScbpModel {
    static getUrlPrefix() {
        return '/my-account/users/';
    }
}

export class Account extends ScbpModel {
    static getUrlPrefix() {
        return '/accounts/';
    }
}

export class DriverUser extends ScbpModel {
    static getUrlPrefix() {
        return '/drivers/';
    }
}

export class AccountToClient extends ScbpModel {
    static getUrlPrefix() {
        return '/my-account/users/';
    }
}

export const userRegistration = {
    modelClass: User,
    buildSelectors({ all }) {
        return {
            // Select the currently logged in User record
            currentUser: createSelector(
                [all, authSelectors.currentUserId],
                (users, userId) => users.get(userId)
            ),
        };
    },
    createModelReducer(model) {
        return createModelReducer(model, {
            /**
             * Hook into the login action to update the user state for the logged
             * in user. This ensures the user is only stored in one place in the
             * redux state and not duplicated in Auth.
             */
            [AUTH_LOGIN](state, { payload }) {
                const { user } = payload;
                return state.setIn(['synced', user.id], user);
            },
        });
    },
};
