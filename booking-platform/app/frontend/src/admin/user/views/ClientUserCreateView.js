import React from 'react';
import CreateView from '../../crud/CreateView';
import ClientUserForm from '../components/ClientUserForm';

export default function ClientUserCreateView(props) {
    return <CreateView {...props} renderForm={formProps => <ClientUserForm {...formProps} />} />;
}
