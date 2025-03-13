import {
    Form,
    FormButton,
    FormField,
    FormItem,
    handleErrorResponse,
} from '@alliance-software/djrad/components/form';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import { Icon } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import { signup } from '../actions';
import styles from '../views/LoginView.less';

function validateSignupForm(data) {
    const { firstName, lastName, email, contactPhone, password, confirmPassword } = data;
    return {
        firstName: !firstName && 'Please enter your first name',
        lastName: !lastName && 'Please enter your last name',
        contactPhone: !contactPhone && 'Please enter your phone number',
        email: !email && 'Please enter your email',
        password: !password && 'Please enter you password',
        confirmPassword: !confirmPassword && 'Please repeat your password',
    };
}

export default function SignupForm(props) {
    const { formName, onSuccess, hideLoginLink, ...rest } = props;

    const { run } = useAsyncRedux(signup, {
        onSuccess,
    });

    const footer = (
        <div className={styles.formFooter}>
            <FormButton
                type="primary"
                size="large"
                showLoading
                loadingMessage="Please wait..."
                htmlType="submit"
            >
                Register and continue <Icon type="right" />
            </FormButton>
        </div>
    );

    const a = String.fromCharCode(window.__APP_CONTEXT__.watchmen.a);
    const b = String.fromCharCode(window.__APP_CONTEXT__.watchmen.b);

    return (
        <>
            <Form
                {...rest}
                name={formName}
                validate={validateSignupForm}
                onSubmit={async data => {
                    try {
                        return await run(data);
                    } catch (e) {
                        return handleErrorResponse(e);
                    }
                }}
                footer={footer}
                layout="horizontal"
            >
                <FormItem
                    label="Title"
                    wrapperCol={{ sm: { span: 8 }, lg: { span: 5 } }}
                    htmlFor="title"
                >
                    <FormField name="title" id="title" autoFocus />
                </FormItem>
                <FormItem label="First name" required htmlFor="firstName">
                    <FormField name="firstName" required autoComplete="given-name" id="firstName" />
                </FormItem>
                <FormItem label="Last name" required htmlFor="lastName">
                    <FormField name="lastName" autoComplete="family-name" id="lastName" />
                </FormItem>
                <FormItem label="Email address" required htmlFor="email">
                    <FormField name="email" autoComplete="email" id="email" />
                </FormItem>
                <FormItem label="Phone (mobile)" required htmlFor="contactPhone">
                    <FormField name="contactPhone" id="contactPhone" />
                </FormItem>
                <FormItem label="Phone (home)" htmlFor="contactPhoneAlternate">
                    <FormField name="contactPhoneAlternate" id="contactPhoneAlternate" />
                </FormItem>
                <FormItem
                    label="Phone (workplace)"
                    htmlFor="contactPhoneWorkplace"
                    style={{ position: 'absolute', top: '-9999px', zIndex: -30 }}
                >
                    <FormField
                        name="contactPhoneWorkplace"
                        id="contactPhoneWorkplace"
                        aria-label="Not to be filled"
                    />
                </FormItem>
                <FormItem label="Please calculate" htmlFor="middleName" required>
                    <FormField
                        name="middleName"
                        id="middleName"
                        placeholder={`${a}${'\uff0b'}${b}`}
                    />
                </FormItem>
                <FormItem
                    label="Password"
                    required
                    hasFeedback
                    htmlFor="password"
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
                        type="password"
                        autoComplete="new-password"
                        id="password"
                    />
                </FormItem>
                <FormItem hasFeedback label="Confirm password" required htmlFor="confirmPassword">
                    <FormField
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        id="confirmPassword"
                    />
                </FormItem>
            </Form>
            {!hideLoginLink && (
                <p>
                    Already have an account? Login <Link to="/login/">here.</Link>
                </p>
            )}
        </>
    );
}

SignupForm.propTypes = {
    formName: PropTypes.string,
    onSuccess: PropTypes.func.isRequired,
    hideLoginLink: PropTypes.bool,
};

SignupForm.defaultProps = {
    formName: 'signup',
};
