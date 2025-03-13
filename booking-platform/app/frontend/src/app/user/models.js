import { createModelReducer } from 'alliance-redux-api';
import { createSelector } from 'reselect';
import { authSelectors } from '../../common/auth/reducer';
import { User, userRegistration } from '../../common/user/models';
import { AUTH_LOGIN } from '../../core/actionTypes';
import ScbpModel from '../../core/model';
import { appSite } from '../djradConfig';

export class ClientAddress extends ScbpModel {
    static getUrlPrefix() {
        return '/address-book/';
    }
}

export class AccountToClient extends ScbpModel {
    static getUrlPrefix() {
        return '/my-account/users/';
    }
}

export class Account extends ScbpModel {
    static getUrlPrefix() {
        return '/my-account/billing-accounts/';
    }

    static getActionUrlPart(action) {
        switch (action) {
            case 'detail':
                return '/account-details/';
            case 'list':
                return '/';
            default:
                return action;
        }
    }
}

export class Booking extends ScbpModel {
    static getUrlPrefix() {
        return '/my-account/bookings/';
    }

    canUserUpdate() {
        if (this.isModifiable == null) {
            // eslint-disable-next-line no-console
            console.warn(
                'Checking canUserUpdate but isModifiable is not known. Check to make sure isModifiable is in the list of fields retrieved.'
            );
        }
        return this.isModifiable;
    }
}

appSite.configureModel('scbp_core.clientuser', userRegistration);
appSite.configureModel('scbp_core.booking', { modelClass: Booking });
appSite.configureModel('scbp_core.account', {
    modelClass: Account,
    buildSelectors({ synced }) {
        const activeAccount = createSelector(
            [authSelectors.activeAccountId, synced],
            (activeAccountId, accounts) => accounts.get(activeAccountId)
        );
        return {
            /**
             * Get current account. May return null if user doesn't have any accounts yet.
             *
             * Usage: const activeAccount = useSelector(Account.selectors.activeAccount);
             */
            activeAccount,
        };
    },
    createModelReducer(model) {
        return createModelReducer(model, {
            /**
             * Hook into the login action to update the active account state for the logged
             * in user. This is returned from backend in AppSite.get_extra_login_response_data -
             * we want to put it into redux here
             */
            [AUTH_LOGIN](state, { payload }) {
                const { activeAccount } = payload;
                if (activeAccount) {
                    return state.setIn(['synced', activeAccount.id], activeAccount);
                }
                return state;
            },
        });
    },
});
appSite.configureModel('scbp_core.accounttoclient', { modelClass: AccountToClient });
appSite.configureModel('scbp_core.clientaddress', { modelClass: ClientAddress });
export { User };
