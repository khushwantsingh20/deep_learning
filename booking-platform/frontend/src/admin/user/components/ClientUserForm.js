import CheckboxWidget from '@alliance-software/djrad/components/form/widgets/CheckboxWidget';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import useSettings from '@alliance-software/djrad/hooks/useSettings';
import { Alert } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { ClientUser } from '../../user/models';
import AccountToClientsList from '../../account/components/AccountToClientList';

const { Item, Field } = ScbpModelForm;

export default function ClientUserForm(props) {
    const { showAccountList, formName } = props;
    const { generateEmail } = useFormValues(formName, ['generateEmail']);
    const { generatedEmailTemplate } = useSettings();
    return (
        <>
            <ScbpModelForm layout="horizontal" model={ClientUser} {...props}>
                <Item name="title" />
                <Item name="firstName" />
                <Item name="lastName" />
                <Item
                    name="email"
                    fieldProps={{ autoComplete: 'email', disabled: generateEmail }}
                    extra={
                        !props.record && (
                            <Field
                                name="generateEmail"
                                isUserDefinedField
                                widget={
                                    <CheckboxWidget>Generate email for this user</CheckboxWidget>
                                }
                            />
                        )
                    }
                />
                <Item
                    name="password"
                    fieldProps={{ type: 'password', autoComplete: 'new-password' }}
                />
                <Item
                    name="confirmPassword"
                    fieldProps={{ type: 'password', autoComplete: 'new-password' }}
                />
                <Item name="contactPhone" />
                <Item name="contactPhoneAlternate" />
                <Item name="driverInstructions" />
                <Item name="internalInstructions" />
                <Item name="priority" />

                <hr />
                {showAccountList && !props.record && (
                    <div>This Client needs to be saved before it can be linked to an account.</div>
                )}
                {generateEmail && (
                    <Alert
                        description={`User will have an email in the form '${generatedEmailTemplate.replace(
                            '{}',
                            '12345'
                        )}' generated.`}
                    />
                )}
            </ScbpModelForm>
            {showAccountList && props.record && <AccountToClientsList clientUser={props.record} />}
        </>
    );
}

ClientUserForm.propTypes = {
    formName: PropTypes.string.isRequired,
    record: modelInstance('scbp_core.clientuser'),
    onSubmit: PropTypes.func.isRequired,
    showAccountList: PropTypes.bool,
    requirePassword: PropTypes.bool,
};
