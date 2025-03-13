import { deleteModel } from '@alliance-software/djrad/actions';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Button, Modal, Popconfirm, List, Input } from 'antd';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import useAddressSourceResolver from '../../../common/hooks/useAddressSourceResolver';
import { ReactComponent as IconPlane } from '../../../images/icon-plane.svg';
import { numeric } from '../../../common/prop-types';
import { airportAddress } from '../../../consts';
import { ClientAddress } from '../models';
import AddressCreate from './AddressCreate';

function DeleteAddress({ address }) {
    const { isLoading, run } = useAsyncRedux(deleteModel, {
        args: [address, address.getId()],
    });

    return (
        <Popconfirm
            title="Are you sure you want to delete this address?"
            onConfirm={() => run()}
            okText="Yes"
            cancelText="No"
        >
            <Button
                loading={isLoading}
                type="danger"
                ghost
                title={`Delete ${address.addressLabel} Address`}
            >
                Delete
            </Button>
        </Popconfirm>
    );
}

DeleteAddress.propTypes = {
    address: PropTypes.object,
};

export default function AddressPickerModal({ visible, onAddressPicked, onClose, client, account }) {
    const [keywords, setKeywords] = useState('');
    const { records, isLoading, error } = useListModel(
        ClientAddress,
        account ? { account } : { client }
    );
    const { resolveAddress } = useAddressSourceResolver();
    const [isEditing, setIsEditing] = useState(false);

    if (isLoading && !records) {
        return null;
    }
    if (error) {
        throw error;
    }

    const closeModal = () => {
        onClose();
        setIsEditing(false);
    };

    const pickAddress = async address => {
        onAddressPicked(await resolveAddress(address));
        closeModal();
    };

    let addresses = records;
    if (keywords) {
        const matches = value =>
            value && value.toLowerCase().includes(keywords.trim().toLowerCase());
        addresses = addresses.filter(
            address =>
                matches(address.addressLabel) ||
                matches(address.formattedAddress) ||
                matches(address.placeName)
        );
    }

    const clientAddresses = [];
    const accountAddresses = [];
    for (const address of addresses) {
        if (address.client === Number(client)) {
            clientAddresses.push(address);
        } else {
            accountAddresses.push(address);
        }
    }

    function renderAddressItem(address) {
        let desc = address.placeName
            ? `${address.placeName}, ${address.formattedAddress}`
            : address.formattedAddress;
        if (address.addressInstructions) {
            desc = (
                <>
                    {desc}
                    <br />
                    {address.addressInstructions}
                </>
            );
        }
        return (
            <List.Item
                key={`address-${address.id}`}
                actions={[
                    <Button onClick={() => pickAddress(address)} type="primary">
                        Select
                    </Button>,
                    <Button type="default" onClick={() => setIsEditing({ address })}>
                        Edit
                    </Button>,
                    <DeleteAddress address={address} />,
                ]}
            >
                <List.Item.Meta title={address.addressLabel} description={desc} />
            </List.Item>
        );
    }

    return (
        <Modal
            title={isEditing ? 'Edit address' : 'Select Address to use'}
            visible={visible}
            footer={null}
            onCancel={closeModal}
            width={900}
        >
            {isEditing && (
                <AddressCreate
                    {...isEditing}
                    clientUserId={client}
                    onSuccess={() => {
                        setIsEditing(false);
                    }}
                />
            )}

            {!isEditing && (
                <>
                    <Input.Search
                        value={keywords}
                        onChange={({ target: { value } }) => setKeywords(value)}
                    />
                    <List itemLayout="horizontal">
                        {(!keywords || 'melbourne airport'.includes(keywords.toLowerCase())) && (
                            <List.Item
                                key="airport"
                                actions={[
                                    <Button
                                        onClick={() => pickAddress(airportAddress)}
                                        type="primary"
                                    >
                                        Select
                                    </Button>,
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<IconPlane style={{ width: 40 }} />}
                                    title="Airport"
                                    description="Melbourne Airport"
                                />
                            </List.Item>
                        )}
                        {clientAddresses.map(renderAddressItem)}
                    </List>
                    {accountAddresses.length > 0 && (
                        <List
                            style={{ marginTop: 20 }}
                            itemLayout="horizontal"
                            header={<h3>Other addresses on account</h3>}
                        >
                            {accountAddresses.map(renderAddressItem)}
                        </List>
                    )}
                </>
            )}
        </Modal>
    );
}

AddressPickerModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    visible: PropTypes.bool,
    onAddressPicked: PropTypes.func.isRequired,
    client: numeric.isRequired,
    account: numeric,
};
