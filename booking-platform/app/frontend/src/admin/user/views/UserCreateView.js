import React from 'react';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import { Alert } from 'antd';
import CreateView from '../../crud/CreateView';
import UserForm from '../components/UserForm';
import { StaffUser, ClientUser } from '../models';

export default function UserCreateView(props) {
    const warning = (
        <Alert
            style={{ marginBottom: 20 }}
            showIcon
            message={
                <>
                    This form can be used to create staff / super users. You may want to create a{' '}
                    <ActionLink bypassPermissions model={ClientUser} action="create">
                        customer profile
                    </ActionLink>{' '}
                    or{' '}
                    <ActionLink bypassPermissions model={StaffUser} action="create">
                        admin profile
                    </ActionLink>{' '}
                    instead
                </>
            }
        />
    );
    return (
        <CreateView
            {...props}
            initialValues={{ isActive: true }}
            renderForm={formProps => <UserForm {...formProps} />}
            prologue={warning}
        />
    );
}
