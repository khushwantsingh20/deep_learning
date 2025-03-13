import React from 'react';
import ScbpModelForm from '../../../common/data/ScbpModelForm';

function UserProfileForm(props) {
    return (
        <ScbpModelForm layout="horizontal" {...props}>
            <ScbpModelForm.Item name="title" />
            <ScbpModelForm.Item name="firstName" />
            <ScbpModelForm.Item name="lastName" />
            <ScbpModelForm.Item name="email" />
            <ScbpModelForm.Item name="contactPhone" />
            <ScbpModelForm.Item name="contactPhoneAlternate" />
            <ScbpModelForm.Item name="driverInstructions" />
            <ScbpModelForm.Item name="internalInstructions" />
        </ScbpModelForm>
    );
}

export default UserProfileForm;
