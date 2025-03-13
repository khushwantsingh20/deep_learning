import React from 'react';
import { message } from 'antd';
import { useSelector } from 'react-redux';

import { modelDetailRoute } from '@alliance-software/djrad/actions';
import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import ScbpModelForm from '../../../common/data/ScbpModelForm';

import { User } from '../models';

const changePassword = (record, data) =>
    modelDetailRoute('post', record, 'change-own-password', data);

export default function UserChangePasswordView() {
    const currentUser = useSelector(User.selectors.currentUser);

    const { formProps, formActions } = useModelFormProcessor({
        formName: 'change-own-password',
        record: currentUser,
        apiAction: changePassword,
        onSuccess: () => {
            message.success('Password changed', 5000);
            formActions.reset();
        },
    });

    return (
        <ScbpModelForm layout="horizontal" {...formProps} f>
            <ScbpModelForm.Item label="Current Password">
                <ScbpModelForm.Field
                    name="currentPassword"
                    isUserDefinedField
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your current password"
                    data-testid="currentPassword"
                />
            </ScbpModelForm.Item>
            <ScbpModelForm.Item
                name="password"
                help={
                    <>
                        Please enter a new password -{' '}
                        <strong>
                            <em>minimum 8 characters</em>
                        </strong>
                    </>
                }
            >
                <ScbpModelForm.Field
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Password"
                    data-testid="password"
                />
            </ScbpModelForm.Item>
            <ScbpModelForm.Item label="Repeat your password">
                <ScbpModelForm.Field
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    data-testid="confirmPassword"
                />
            </ScbpModelForm.Item>
        </ScbpModelForm>
    );
}
