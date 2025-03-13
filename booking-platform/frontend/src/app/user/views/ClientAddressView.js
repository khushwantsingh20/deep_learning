import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import { Col, Row, Skeleton } from 'antd';
import { PropTypes } from 'prop-types';
import React, { useState } from 'react';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import { AccountToClient } from '../models';
import ClientAddressBook from '../components/ClientAddressBook';

function ClientAddressView({ user }) {
    const isAccountToClient = user instanceof AccountToClient;

    let clientUser;
    if (isAccountToClient) {
        clientUser = user.clientUser;
    } else {
        clientUser = user;
    }

    const [modalProps, setModalProps] = useState(false);
    const [deleteModalProps, setDeleteModalProps] = useState(false);
    const { records: allAddresses, isLoading } = useListModel('scbp_core.clientaddress', {
        client: clientUser,
    });

    function closeModal() {
        setModalProps(false);
    }

    if (isLoading) {
        return <Skeleton />;
    }

    return (
        <Row>
            <Col lg={{ span: 18, offset: 3 }}>
                {isAccountToClient && (
                    <p>
                        <ActionLink model={AccountToClient} action="list">
                            &lt; Back to users
                        </ActionLink>
                    </p>
                )}
                <h2 className="h3">
                    {isAccountToClient
                        ? `Address book for ${user.firstName} ${user.lastName}`
                        : 'My address book'}
                </h2>
                <ClientAddressBook
                    addresses={allAddresses.toArray()}
                    closeModal={() => closeModal()}
                    isLoading={isLoading}
                    modalProps={modalProps}
                    setModalProps={setModalProps}
                    deleteModalProps={deleteModalProps}
                    setDeleteModalProps={setDeleteModalProps}
                    clientUserId={clientUser}
                />
            </Col>
        </Row>
    );
}

export default ClientAddressView;

ClientAddressView.propTypes = {
    user: PropTypes.oneOfType([PropTypes.instanceOf(AccountToClient), PropTypes.number]),
};
