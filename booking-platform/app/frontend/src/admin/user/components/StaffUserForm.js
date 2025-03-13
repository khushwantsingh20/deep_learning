import ChoicesWidget from '@alliance-software/djrad/components/form/widgets/ChoicesWidget';
import PropTypes from 'prop-types';
import React from 'react';
import InputWidget from '@alliance-software/djrad/components/form/widgets/InputWidget';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { staffUserTypeChoices } from '../../../choiceConstants';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { StaffUser } from '../models';

const { Field, Item } = ScbpModelForm;

function makeValidator(requirePassword) {
    return data => {
        const { firstName, lastName, email, password, userType, confirmPassword } = data;
        const errors = {
            firstName: !firstName && 'Please enter first name',
            lastName: !lastName && 'Please enter last name',
            email: !email && 'Please enter email',
            userType: !userType && 'Please select user type',
            confirmPassword: requirePassword && !confirmPassword && 'Please repeat the password',
        };
        if (requirePassword) {
            errors.password = !password && 'Please enter a password';
            errors.confirmPassword = !confirmPassword
                ? 'Please repeat the password'
                : confirmPassword !== password && 'Passwords do not match';
        }
        return errors;
    };
}

export default function StaffUserForm(props) {
    return (
        <ScbpModelForm
            validate={makeValidator(!props.record)}
            layout="horizontal"
            model={StaffUser}
            {...props}
        >
            <Item name="firstName" />
            <Item name="lastName" />
            <Item name="email" fieldProps={{ autoComplete: 'email' }} />
            <Item
                name="password"
                widget={<InputWidget type="password" autoComplete="new-password" />}
            />
            <Item label="Confirm Password">
                <Field
                    isUserDefinedField
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                />
            </Item>
            <Item name="userType" widget={<ChoicesWidget choices={staffUserTypeChoices} />} />
        </ScbpModelForm>
    );
}

StaffUserForm.propTypes = {
    record: modelInstance('scbp_core.staffuser'),
    onSubmit: PropTypes.func.isRequired,
};
