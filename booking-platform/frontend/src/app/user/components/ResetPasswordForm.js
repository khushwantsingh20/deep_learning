import React from 'react';
import PropTypes from 'prop-types';
import { message } from 'antd';
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
    const { password, confirmPassword } = data;
    return {
        password: !password && 'Please enter you password',
        confirmPassword: !confirmPassword && 'Please repeat your password',
    };
}

export default function ResetPasswordForm(props) {
    const { formName, ...rest } = props;
    const onSubmit = async data => {
        const { onSuccess } = props;
        try {
            const requestData = { token: props.token, ...data };
            const response = await api.listRoutePost(User, 'reset_password', requestData);
            message.success('Thank you, your password has been reset');
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
            Reset password
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
                <FormItem
                    hasFeedback
                    label="Password"
                    help={
                        <>
                            Please enter a new password -{' '}
                            <strong>
                                <em>minimum 8 characters</em>
                            </strong>
                        </>
                    }
                >
                    <FormField
                        name="password"
                        placeholder="Password"
                        type="password"
                        autoComplete="new-password"
                    />
                </FormItem>
                <FormItem hasFeedback label="Repeat your password">
                    <FormField
                        name="confirmPassword"
                        placeholder="Repeat your password"
                        type="password"
                        autoComplete="new-password"
                    />
                </FormItem>
            </Form>
        </>
    );
}

ResetPasswordForm.propTypes = {
    formName: PropTypes.string,
    onSuccess: PropTypes.func.isRequired,
    token: PropTypes.string.isRequired,
};

ResetPasswordForm.defaultProps = {
    formName: 'change_password',
};
