import React from 'react';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import { useSelector } from 'react-redux';

import { AccountToClient } from '../models';
import AccountToClientForm from './AccountToClientForm';

import styles from './AccountToClientList.less';

export default function AccountToClientsList(props) {
    // Fetch list of users once, don't refetch on any changes
    const queryParams = {};
    if (props.account) {
        queryParams.account = props.account.id;
    }
    if (props.clientUser) {
        queryParams.clientUser = props.clientUser.id;
    }
    const { isLoading, error } = useListModel(AccountToClient, queryParams, { refetchOn: false });
    // Select all records out of redux. Makes UI nicer without it jumping around if we
    // otherwise refetch records after each change. As we know the list here will be
    // reasonably constrained we can always just read data from the cache directly.
    const records = useSelector(state =>
        AccountToClient.selectors
            .all(state)
            .toList()
            .filter(
                r =>
                    (props.account && r.account === props.account.id) ||
                    (props.clientUser && r.clientUser === props.clientUser.id)
            )
    );
    if (isLoading) {
        return null;
    }
    if (error) {
        throw error;
    }
    return (
        <>
            <div className={styles.rowHeader}>
                <div className={styles.client}>
                    Linked {props.account ? 'Clients' : 'Accounts'}{' '}
                </div>
                <div className={styles.permission}>User Management</div>
                <div className={styles.action}>&nbsp;</div>
            </div>
            {records.map(link => (
                <AccountToClientForm
                    key={link.id}
                    account={props.account}
                    clientUser={props.clientUser}
                    record={link}
                    buttonText="Unlink"
                />
            ))}
            <AccountToClientForm account={props.account} clientUser={props.clientUser} />
        </>
    );
}

AccountToClientsList.propTypes = {
    account: modelInstance('scbp_core.account'),
    clientUser: modelInstance('scbp_core.clientuser'),
};
