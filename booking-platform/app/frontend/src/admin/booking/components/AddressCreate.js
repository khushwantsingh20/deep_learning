import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import PropTypes from 'prop-types';
import React from 'react';
import { ClientAddress } from '../models';
import AddressForm from './AddressForm';

function AddressCreate({ address: rawAddress, addressType, onSuccess, clientUserId }) {
    // If we get a ClientAddress, it's our record
    // Otherwise, we have a plain JS object with the fields we expect to add
    const address = rawAddress instanceof ClientAddress ? rawAddress : null;
    const { formProps } = useModelFormProcessor({
        record: address,
        model: ClientAddress,
        onSuccess,
        transformData: ({ address: adr, ...data }) => ({
            client: clientUserId,
            ...adr,
            ...data,
            addressType: address ? address.addressType : addressType.value,
        }),
    });

    let initialValues = {};
    if (address) {
        initialValues = {
            address: address.toJS(),
            addressLabel: address.addressLabel,
            addressType: address.addressType,
            addressInstructions: address.addressInstructions,
        };
    } else if (rawAddress) {
        initialValues = {
            address: rawAddress,
            addressType,
            addressInstructions: rawAddress.addressInstructions,
        };
    }

    return (
        <div>
            <AddressForm {...formProps} layout="vertical" initialValues={initialValues} />
        </div>
    );
}

export default AddressCreate;

AddressCreate.propTypes = {
    address: PropTypes.object,
    addressType: PropTypes.object,
    onSuccess: PropTypes.func,
    clientUserId: PropTypes.number,
};
