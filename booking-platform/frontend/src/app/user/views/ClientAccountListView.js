import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { Button, Popconfirm, Skeleton } from 'antd';
import { PropTypes } from 'prop-types';
import React from 'react';
import { modelDetailRoute } from '@alliance-software/djrad/actions';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import { useSelector } from 'react-redux';
import { User } from '../../../common/user/models';
import List from '../../components/List';
import styles from './ClientAccountCreateView.less';

function AccountSetDefaultAction({ accountToClient }) {
    const { run, isLoading } = useAsyncRedux(() =>
        modelDetailRoute('post', accountToClient, 'set_as_default')
    );

    const handleUpdate = () => run();
    return (
        <Button
            size="small"
            className={styles.accountAction}
            onClick={handleUpdate}
            loading={isLoading}
        >
            Set default
        </Button>
    );
}

AccountSetDefaultAction.propTypes = {
    accountToClient: modelInstance(),
};

const actionMeta = { batchCall: true };

function ClientAccountItem({ account, activeAccount }) {
    const currentUser = useSelector(User.selectors.currentUser);

    const { record, isLoading, error } = useGetModel(
        'scbp_core.accounttoclient',
        {
            account: account.id,
            clientUser: currentUser.id,
        },
        { actionMeta }
    );

    const { run, isLoading: isArchiveAccountLoading } = useAsyncRedux(() =>
        modelDetailRoute('post', account, 'archive')
    );

    if (error) {
        throw error;
    }

    if (isLoading) {
        return <Skeleton title paragraph={false} />;
    }

    let accountName;

    if (activeAccount && account.id === activeAccount.id) {
        accountName = (
            <span>
                {account.__str__} &ndash; <small>active account</small>
            </span>
        );
    } else {
        accountName = <span>{account.__str__}</span>;
    }

    return (
        <List.Item
            actions={
                <>
                    <ActionLinkList record={account} actions={['detail', 'update']} />
                    {record.isDefaultAccount && (
                        <span key={record.id} className={styles.defaultLabel}>
                            Default
                        </span>
                    )}
                    {!record.isDefaultAccount && (
                        <AccountSetDefaultAction key={record.id} accountToClient={record} />
                    )}
                    {record.isAccountAdmin && (
                        <Popconfirm
                            title="Are you sure you want to delete this account?"
                            onConfirm={run}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                type="danger"
                                size="small"
                                ghost
                                loading={isArchiveAccountLoading}
                            >
                                Delete
                            </Button>
                        </Popconfirm>
                    )}
                </>
            }
        >
            {accountName}
        </List.Item>
    );
}

ClientAccountItem.propTypes = {
    account: modelInstance(),
    activeAccount: modelInstance('scbp_core.account'),
};

function ClientAccountListView({ accounts, activeAccount }) {
    return (
        <section className={styles.existingAccounts}>
            <List>
                {accounts.map(account => (
                    <ClientAccountItem
                        key={account.id}
                        account={account}
                        activeAccount={activeAccount}
                    />
                ))}
            </List>
        </section>
    );
}

ClientAccountListView.propTypes = {
    accounts: PropTypes.array.isRequired,
    activeAccount: modelInstance('scbp_core.account'),
};

export default ClientAccountListView;
