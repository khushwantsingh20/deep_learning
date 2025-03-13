import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
    handleErrorResponse,
    Form,
    FormButton,
    FormField,
    FormItem,
} from '@alliance-software/djrad/components/form';
import api from '../../../common/api';
import { User } from '../../user/models';

function validateSignupForm(data) {
    const { email } = data;
    return {
        email: !email && 'Please enter your email',
    };
}

export default function PasswordResetRequestForm(props) {
    const { formName, ...rest } = props;

    const onSubmit = async data => {
        const { onSuccess } = props;
        try {
            const response = await api.listRoutePost(User, 'request_password_reset', data);
            onSuccess(response);
        } catch (apiError) {
            handleErrorResponse(apiError);
        }
    };

    const footer = (
        <FormButton
            type="primary"
            size="large"
            showLoading
            loadingMessage="Please wait..."
            htmlType="submit"
        >
            Reset Password
        </FormButton>
    );

    return (
        <>
            <Form
                {...rest}
                name={formName}
                validate={validateSignupForm}
                onSubmit={onSubmit}
                footer={footer}
            >
                <FormItem label="Email address">
                    <FormField
                        name="email"
                        placeholder="e.g. yourname@example.com"
                        autoComplete="email"
                    />
                </FormItem>
            </Form>
            <p>
                Remember your password? Login <Link to="/login/">here.</Link>
            </p>
        </>
    );
}

PasswordResetRequestForm.propTypes = {
    formName: PropTypes.string,
    onSuccess: PropTypes.func.isRequired,
};

PasswordResetRequestForm.defaultProps = {
    formName: 'request_password_change',
};
