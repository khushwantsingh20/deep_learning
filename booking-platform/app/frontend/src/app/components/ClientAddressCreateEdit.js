import { FORM_ACTIONS } from '@alliance-software/djrad/components/form/FormButton';
import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import PropTypes from 'prop-types';
import React from 'react';
import { ClientAddressType } from '../../choiceConstants';
import ClientAddressForm from './ClientAddressForm';
import { ClientAddress } from '../user/models';

function ClientAddressCreateEdit({
    address: rawAddress,
    addressType,
    onSuccess,
    onDelete,
    clientUserId,
}) {
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
        initialValues = { address: rawAddress, addressType };
    } else {
        initialValues = {
            addressLabel: addressType !== ClientAddressType.OTHER ? addressType.label : '',
        };
    }

    return (
        <ClientAddressForm
            {...formProps}
            layout="vertical"
            initialValues={initialValues}
            onFormAction={action => {
                if (action === FORM_ACTIONS.DELETE) {
                    onDelete(address);
                }
            }}
        />
    );
}

export default ClientAddressCreateEdit;

ClientAddressCreateEdit.propTypes = {
    address: PropTypes.object,
    addressType: PropTypes.object,
    onSuccess: PropTypes.func,
    /** Called when delete button pressed. This is only required if `address` is passed in. */
    onDelete: PropTypes.func,
    clientUserId: PropTypes.number,
};
