import ButtonBar from '@alliance-software/djrad/components/form/ButtonBar';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import React from 'react';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { ClientAddress } from '../models';
import AddressLookupWidget from '../../../common/form/AddressLookupWidget';

function AddressForm(props) {
    const footer = (
        <ButtonBar
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

AddressForm.propTypes = {
    record: modelInstance('scbp_core.clientaddress'),
};

export default AddressForm;
