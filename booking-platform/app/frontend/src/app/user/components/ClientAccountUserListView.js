import useListModel from '@alliance-software/djrad/hooks/useListModel';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { Button, Empty, Icon, Modal, Skeleton, Tooltip } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { AccountToClient } from '../models';
import ClientAccountToClientForm from './ClientAccountToClientForm';

import styles from './ClientAccountUserListView.less';

function ClientAccountUserListView({ currentUser, account }) {
    const { isLoading } = useListModel('scbp_core.accounttoclient', {}, { refetchOn: false });
    const records = useSelector(state =>
        AccountToClient.selectors
            .all(state)
            .toList()
            .filter(record => record.clientUser !== currentUser.id && record.account === account)
    );

    const [showModal, setShowModal] = useState(false);

    if (isLoading) return <Skeleton />;

    return (
        <>
            <h2 className={`${styles.actionHeading} h3`}>
                Users
                <Button onClick={() => setShowModal(true)}>Invite user</Button>
            </h2>

            <div className={styles.userFauxTable}>
                <div className={styles.headings}>
                    <div>Users</div>
                    <div>
                        Administrator{' '}
                        <Tooltip
                            placement="bottom"
                            title="Administrators can manage all details about this account, invite new users to the account, and book trips for any linked user"
                        >
                            <Icon type="info-circle" theme="twoTone" className={styles.tooltip} />
                        </Tooltip>
                    </div>
                    <div>&nbsp;</div>
                    <div>Actions</div>
                </div>
                <div>
                    {records.toArray().length > 0 &&
                        records
                            .toArray()
                            .map(record => (
                                <ClientAccountToClientForm
                                    key={record.id}
                                    clientUser={record.clientUser}
                                    record={record}
                                />
                            ))}
                    {!records.toArray().length && (
                        <div className={styles.empty}>
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No Users" />
                        </div>
                    )}
                </div>
            </div>
            {showModal && (
                <Modal
                    onCancel={() => setShowModal(false)}
                    title="Invite a user to this billing account"
                    footer={null}
                    visible
                    className="modal-md"
                >
                    <p>
                        If you&apos;re inviting an existing user of Southern Cross, please enter
                        their registered email address.
                    </p>

                    <ClientAccountToClientForm
                        account={account}
                        onSuccess={() => setShowModal(false)}
                    />
                </Modal>
            )}
        </>
    );
}

export default ClientAccountUserListView;

ClientAccountUserListView.propTypes = {
    currentUser: modelInstance('scbp_core.clientuser'),
    account: modelInstance('scbp_core.account'),
};
