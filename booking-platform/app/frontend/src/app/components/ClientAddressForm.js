import ButtonBar from '@alliance-software/djrad/components/form/ButtonBar';
import { FORM_ACTIONS } from '@alliance-software/djrad/components/form/FormButton';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import React from 'react';
import ScbpModelForm from '../../common/data/ScbpModelForm';
import AddressLookupWidget from '../../common/form/AddressLookupWidget';
import { ClientAddress } from '../user/models';

function ClientAddressForm(props) {
    const footer = (
        <ButtonBar
            leftButtons={
                props.record && (
                    <ScbpModelForm.Button action={FORM_ACTIONS.DELETE} type="danger">
                        Delete
                    </ScbpModelForm.Button>
                )
            }
            rightButtons={
                <ScbpModelForm.Button htmlType="submit" type="primary">
                    Save
                </ScbpModelForm.Button>
            }
        />
    );

    return (
        <ScbpModelForm
            footer={footer}
            model={ClientAddress}
            layout="horizontal"
            forceConnected
            {...props}
        >
            <ScbpModelForm.Item label="Address">
                <ScbpModelForm.Field
                    name="address"
                    isUserDefinedField
                    widget={AddressLookupWidget}
                />
            </ScbpModelForm.Item>
            <ScbpModelForm.Item name="addressLabel" />
            <ScbpModelForm.Item name="addressInstructions" />
        </ScbpModelForm>
    );
}

ClientAddressForm.propTypes = {
    record: modelInstance('scbp_core.clientaddress'),
};

export default ClientAddressForm;
