import { Button, Input, List } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

function BookingSavedLocations({ addresses, onSelect, clientUserId }) {
    const [keywords, setKeywords] = useState('');
    const clientAddresses = [];
    const accountAddresses = [];
    let filteredAddresses = addresses;
    if (keywords) {
        const matches = value =>
            value && value.toLowerCase().includes(keywords.trim().toLowerCase());
        filteredAddresses = filteredAddresses.filter(
            address =>
                matches(address.addressLabel) ||
                matches(address.formattedAddress) ||
                matches(address.placeName)
        );
    }
    for (const address of filteredAddresses) {
        if (address.client === clientUserId) {
            clientAddresses.push(address);
        } else {
            accountAddresses.push(address);
        }
    }

    return (
        <>
            <Input.Search
                autoFocus
                value={keywords}
                onChange={({ target: { value } }) => setKeywords(value)}
            />
            <List
                dataSource={clientAddresses}
                renderItem={item => (
                    <List.Item
                        actions={[
                            <Button type="link" onClick={() => onSelect(item)}>
                                Select
                            </Button>,
                        ]}
                    >
                        <List.Item.Meta
                            title={item.addressLabel}
                            description={item.formattedAddress}
                        />
                    </List.Item>
                )}
            />
            {accountAddresses.length > 0 && (
                <List
                    style={{ marginTop: 20 }}
                    header={<h3>Other addresses on account</h3>}
                    dataSource={accountAddresses}
                    renderItem={item => (
                        <List.Item
                            actions={[
                                <Button type="link" onClick={() => onSelect(item)}>
                                    Select
                                </Button>,
                            ]}
                        >
                            <List.Item.Meta
                                title={item.addressLabel}
                                description={item.formattedAddress}
                            />
                        </List.Item>
                    )}
                />
            )}
        </>
    );
}

BookingSavedLocations.propTypes = {
    addresses: PropTypes.array.isRequired,
    clientUserId: PropTypes.number,
    onSelect: PropTypes.func,
};

export default BookingSavedLocations;
