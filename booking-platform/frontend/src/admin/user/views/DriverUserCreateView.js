import React from 'react';
import CreateView from '../../crud/CreateView';
import DriverUserForm from '../components/DriverUserForm';

export default function DriverUserCreateView(props) {
    return (
        <CreateView
            {...props}
            initialValues={{ isActive: true }}
            renderForm={formProps => <DriverUserForm {...formProps} />}
        />
    );
}
