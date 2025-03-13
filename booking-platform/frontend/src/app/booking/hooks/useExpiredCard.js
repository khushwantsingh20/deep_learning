import useAsync from '@alliance-software/djrad/hooks/useAsync';
import Api, { createRecordFromId } from '../../../common/api';
import { Account } from '../../user/models';

async function getCardExpired(accountId) {
    return Api.detailRouteGet(createRecordFromId(Account, accountId), 'is-card-expired');
}

export function useCardExpired(accountId) {
    return useAsync(getCardExpired, {
        args: [accountId],
        trigger: accountId ? useAsync.SHALLOW : useAsync.MANUAL,
    }).response;
}
