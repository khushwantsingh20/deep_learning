import React from 'react';
import UpdateView from '../../crud/UpdateView';
import UserForm from '../components/UserForm';

export default function UserUpdateView(props) {
    return <UpdateView renderForm={formProps => <UserForm {...formProps} />} {...props} />;
}
