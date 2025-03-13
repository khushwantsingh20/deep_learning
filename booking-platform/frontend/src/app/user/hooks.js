import { useSelector } from 'react-redux';
import { Account, AccountToClient, User } from './models';

/**
 * Get the current active record for the current user
 *
 * NOTE: If user is account admin then this will only be a partial record... most fields will
 * be null. See ScbpAppSite.get_active_account_context for where this is determined.
 */
export const useActiveAccount = () => useSelector(Account.selectors.activeAccount);

/**
 * Get the current active account for the current user
 */
export const useAccountNickname = accountId => {
    const accountToClient = useSelector(state =>
        AccountToClient.selectors.partialFields.synced(state)(['account', 'accountNickname'])
    )
        .filter(accToClient => accToClient.account === accountId)
        .first();

    // This should never happen - all account to client records are fetched up front
    if (!accountToClient) {
        // eslint-disable-next-line no-console
        console.warn(
            `Expected to find Account to Client record for account ${accountId} but didn't. This is unexpected.`
        );
        return '';
    }
    return accountToClient.accountNickname;
};

/**
 * Get the currently logged in user
 */
export const useCurrentUser = () => useSelector(User.selectors.currentUser);
