import React from 'react';

import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import useAsync from '@alliance-software/djrad/hooks/useAsync';

import { numeric } from '../../../common/prop-types';
import { Account } from '../../../common/user/models';
import Api, { createRecordFromId } from '../../../common/api';

async function getCardExpired(accountId) {
    return Api.detailRouteGet(createRecordFromId(Account, accountId), 'is-card-expired');
}

export function useCardExpired(accountId) {
    return useAsync(getCardExpired, { args: [accountId], trigger: useAsync.SHALLOW }).response;
}

export default function ExpiredCreditCardWarning({ accountId }) {
    const isCardExpired = useCardExpired(accountId);
    if (isCardExpired) {
        return (
            <div style={{ color: 'red' }}>
                Credit card expired.{' '}
                <ActionLink record={createRecordFromId(Account, accountId)} action="update">
                    Update
                </ActionLink>{' '}
                before finalising booking.
            </div>
        );
    }
    return null;
}

ExpiredCreditCardWarning.propTypes = {
    /**
     * The ID of the account to check expiry for. If expired will display a warning, otherwise won't render anything.
     */
    accountId: numeric.isRequired,
};
