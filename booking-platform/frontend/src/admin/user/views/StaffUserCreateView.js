import React from 'react';
import CreateView from '../../crud/CreateView';
import StaffUserForm from '../components/StaffUserForm';

export default function StaffUserCreateView(props) {
    return (
        <CreateView
            {...props}
            initialValues={{ isActive: true }}
            renderForm={formProps => <StaffUserForm {...formProps} />}
        />
    );
}
