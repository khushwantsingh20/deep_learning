import React from 'react';
import UpdateView from '../../crud/UpdateView';
import StaffUserForm from '../components/StaffUserForm';

export default function StaffUserUpdateView(props) {
    return <UpdateView renderForm={formProps => <StaffUserForm {...formProps} />} {...props} />;
}
