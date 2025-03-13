import useListModel from '@alliance-software/djrad/hooks/useListModel';
import useSite from '@alliance-software/djrad/hooks/useSite';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useActiveAccount, useCurrentUser } from '../../user/hooks';
import { ClientAddress } from '../../user/models';

/**
 * Hook that looks up addresses for either the current user or the current passenger and returns
 * the list of address records, whether current user can add addresses and the resolved client id
 * for the purposes of managing addresses.
 *
 * This is intended for use as part of the booking process for rendering the address entry fields
 * for from / destination and additional stops.
 */
export default function useAddressBook({ passenger }) {
    const site = useSite();
    const currentUser = useCurrentUser();
    const activeAccount = useActiveAccount();
    const addressClientId = passenger ? Number(passenger) : currentUser && currentUser.id;
    const [hasUserManagementPerm, setHasUserManagementPerm] = useState(false);
    useEffect(() => {
        let isCurrent = true;
        if (activeAccount) {
            const run = async () => {
                const hasPerm = await site.permissionChecker.hasPerm(
                    'scbp_core.user_management_account',
                    activeAccount
                );
                if (isCurrent) {
                    setHasUserManagementPerm(hasPerm);
                }
            };
            run();
        }
        return () => {
            isCurrent = false;
        };
    });
    const canAddAddress =
        (currentUser && addressClientId === currentUser.id) || hasUserManagementPerm;

    // Trigger initial fetch and populate redux with the records. We read from redux below.
    const { isLoading, run, records } = useListModel(
        'scbp_core.clientaddress',
        activeAccount
            ? { account: activeAccount.id }
            : {
                  client: addressClientId,
              },
        { trigger: useListModel.MANUAL }
    );

    useEffect(() => {
        if (addressClientId) {
            run();
        }
    }, [addressClientId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Always select all addresses in redux, not just the records returned in the initial fetch. This handles
    // the case where we add a new address as part of the booking process.
    // We do include all records that were returned as well for cases where the filter includes
    // addresses that aren't the specified clients (eg. when filtering by account)
    const recordIds = records ? records.map(r => r.id).toArray() : [];
    const addressBook = useSelector(state =>
        ClientAddress.selectors
            .all(state)
            .toList()
            .sortBy(r => (r.addressLabel || '').toLowerCase())
    ).filter(address => address.client === addressClientId || recordIds.includes(address.id));

    return {
        isLoading,
        addressBook,
        canAddAddress,
        addressClientId,
    };
}
