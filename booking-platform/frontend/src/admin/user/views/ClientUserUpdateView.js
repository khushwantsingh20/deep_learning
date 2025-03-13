import React from 'react';
import UpdateView from '../../crud/UpdateView';
import ClientUserForm from '../components/ClientUserForm';

export default function ClientUserUpdateView(props) {
    return (
        <UpdateView
            renderForm={formProps => <ClientUserForm showAccountList {...formProps} />}
            {...props}
        />
    );
}
