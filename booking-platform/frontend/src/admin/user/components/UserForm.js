import CheckPermission from '@alliance-software/djrad/components/permissions/CheckPermission';
import useModelClass from '@alliance-software/djrad/hooks/useModelClass';
import PropTypes from 'prop-types';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { change, getFormValues } from 'redux-form';
import InputWidget from '@alliance-software/djrad/components/form/widgets/InputWidget';
import SwitchWidget from '@alliance-software/djrad/components/form/widgets/SwitchWidget';
import { modelClass, modelInstance } from '@alliance-software/djrad/prop-types/model';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { User } from '../../../common/user/models';
import { StaffUser } from '../models';

const { Field, Item } = ScbpModelForm;

function makeValidator(requirePassword) {
    return data => {
        const { firstName, lastName, email, password, confirmPassword } = data;
        const errors = {
            firstName: !firstName && 'Please enter first name',
            lastName: !lastName && 'Please enter last name',
            email: !email && 'Please enter email',
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

export default function UserForm(props) {
    const dispatch = useDispatch();
    const model = useModelClass(props.model || props.record);
    // SwitchWidgets no longer seem to work correctly - the default onChange method sees them as a button and tries to
    // set their value to "", rather than true or false.  The current value for the widget is also supplied via the
    // `checked` parameter, not `value`, leading to the widget not showing the current value correctly.
    //
    // We wrap the widget onChange and retrieve the underlying form values in order to provide the correct value to the
    // widget for the `checked` parameter.
    const formValues = useSelector(state => getFormValues(props.formName)(state)) || {};
    const wrappedOnChange = fieldName => {
        return checked => {
            dispatch(change(props.formName, fieldName, checked || false));
            return checked;
        };
    };
    // When a SwitchWidget is unchecked, the value stored in redux seems to be `null` rather than `false` which the
    // backend doesn't like.  So when submitting, override `null` with `false` in the payload.
    const wrappedOnSubmit = payload => {
        props.onSubmit({
            ...payload,
            isActive: payload.isActive || false,
            isSuperuser: payload.isSuperuser || false,
        });
    };
    return (
        <ScbpModelForm
            validate={makeValidator(!props.record)}
            layout="horizontal"
            {...props}
            onSubmit={wrappedOnSubmit}
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
            <Item
                name="isActive"
                widget={SwitchWidget}
                fieldProps={{
                    widgetProps: {
                        checked: formValues.isActive,
                        onChange: wrappedOnChange('isActive'),
                    },
                }}
            />
            {model === StaffUser && <Item name="userType" />}
            {/* For User model show extra admin specific fields if user has permission */}
            {model === User && (
                <CheckPermission
                    perm="is_superuser"
                    render={() => (
                        <Item
                            name="isSuperuser"
                            widget={SwitchWidget}
                            fieldProps={{
                                widgetProps: {
                                    checked: formValues.isSuperuser,
                                    onChange: wrappedOnChange('isSuperuser'),
                                },
                            }}
                        />
                    )}
                />
            )}
        </ScbpModelForm>
    );
}

UserForm.propTypes = {
    formName: PropTypes.string.isRequired,
    model: modelClass([
        'scbp_core.user',
        'scbp_core.staffuser',
        'scbp_core.clientuser',
        'scbp_core.driveruser',
    ]),
    record: modelInstance([
        'scbp_core.user',
        'scbp_core.staffuser',
        'scbp_core.clientuser',
        'scbp_core.driveruser',
    ]),
    onSubmit: PropTypes.func.isRequired,
};
