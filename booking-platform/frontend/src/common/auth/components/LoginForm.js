import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
    handleErrorResponse,
    Form,
    FormButton,
    FormField,
    FormItem,
} from '@alliance-software/djrad/components/form';
import { login } from '../actions';
import useUserDeviceToken from '../../hooks/useUserDeviceToken';

function validateLoginForm(data) {
    const { username, password } = data;
    return {
        username: !username && 'Please enter your username',
        password: !password && 'Please enter you password',
    };
}

/**
 * Basic login form.
 */
export default function LoginForm(props) {
    const { autoFocusField, onSuccess, hideSignupLink, formName, initialValues, ...rest } = props;
    const { token } = useUserDeviceToken();

    const { run } = useAsyncRedux(login, {
        onSuccess,
    });
    const performLogin = async data => {
        if (token) {
            data.token = token;
        }
        try {
            await run(data);
        } catch (e) {
            handleErrorResponse(e);
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
            Sign in
        </FormButton>
    );

    return (
        <>
            <Form
                {...rest}
                name={formName}
                validate={validateLoginForm}
                onSubmit={performLogin}
                footer={footer}
                initialValues={initialValues}
                // Don't touch on blur so validation doesn't show immediately. Prevents errors
                // showing when you click Signup link due to autofocus on username
                touchOnBlur={false}
            >
                <FormItem>
                    <FormField
                        name="username"
                        placeholder="Email address"
                        autoFocus={autoFocusField === 'username'}
                        autoComplete="username"
                    />
                </FormItem>
                <FormItem hasFeedback>
                    <FormField
                        name="password"
                        placeholder="Password"
                        type="password"
                        autoFocus={autoFocusField === 'password'}
                        autoComplete="current-password"
                    />
                </FormItem>
            </Form>
            {!hideSignupLink && (
                <p>
                    Don&apos;t have an account? Signup <Link to="/signup/">here.</Link>
                </p>
            )}
            <p>
                Forgot your password? Reset <Link to="/request-password-reset/">here.</Link>
            </p>
        </>
    );
}

LoginForm.defaultProps = {
    autoFocusField: 'username',
    formName: 'login',
    hideSignupLink: false,
};

LoginForm.propTypes = {
    /** Which field (if any) to focus on when form is mounted. Defaults to username. */
    autoFocusField: PropTypes.string,
    /** Whether to hide the signup link. Defaults to false. */
    hideSignupLink: PropTypes.bool,
    onSuccess: PropTypes.func,
    /** Change state key used in redux-form */
    formName: PropTypes.string,
    /** Initial passed in form values */
    initialValues: PropTypes.object,
    layout: PropTypes.oneOf(['horizontal', 'vertical', 'inline']),
    /** Any other props passed directly through to underlying form */
};
