import FormButton from '@alliance-software/djrad/components/form/FormButton';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { Icon } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import { Link } from 'react-router-dom';
import { BookingStep } from '../steps';
import styles from './CreateBookingController.less';

export default function CreateBookingButtonBar({
    currentStep,
    goPrevious,
    header,
    currentUser,
    account,
    onCreateOrLogin,
    onAccountSetup,
    clearForm,
    subHeading,
}) {
    return (
        <div
            className={cx(
                styles.bookingBar,
                { [styles.hasHeader]: header },
                { [styles.isSummary]: currentStep.isCompleteBookingStep() }
            )}
            style={{
                '--progress-width': `${((currentStep.getStepIndex() + 1) / currentStep.getCount()) *
                    100}%`,
            }}
        >
            {header && (
                <div>
                    <h2 className={styles.heading}>
                        <span className={styles.headingStepIndex}>
                            Step {currentStep.getStepIndex() + 1} of {currentStep.getCount()}
                        </span>
                        {header}
                    </h2>
                    {subHeading}
                </div>
            )}
            {currentStep.isFirst() && <FormButton onClick={clearForm}>Clear Booking</FormButton>}
            {!currentStep.isFirst() && (
                <FormButton onClick={goPrevious}>
                    <Icon type="left" /> Back
                </FormButton>
            )}
            {!currentStep.isLast() && !currentStep.isLoginRequiredToContinue() && (
                <FormButton type="primary" htmlType="submit" showLoading>
                    Next <Icon type="right" />
                </FormButton>
            )}
            {currentStep.isLoginRequiredToContinue() && !header && !currentUser && (
                <>
                    <FormButton type="primary" block onClick={onCreateOrLogin}>
                        Sign in to submit your booking request
                    </FormButton>
                    <small>
                        Please note: If you have an existing login prior to 1st March 2020, you will
                        need to&nbsp;
                        <Link to="/request-password-reset/">reset your password</Link> if you have
                        not done so already.
                    </small>
                </>
            )}
            {currentStep.isLoginRequiredToContinue() && !header && currentUser && !account && (
                <FormButton type="primary" block onClick={onAccountSetup}>
                    Complete billing setup to finalise booking
                </FormButton>
            )}
            {currentStep.isLoginRequiredToContinue() && !header && currentUser && account && (
                <FormButton type="primary" htmlType="submit" showLoading>
                    Submit booking request <Icon type="right" />
                </FormButton>
            )}
        </div>
    );
}

CreateBookingButtonBar.propTypes = {
    currentStep: PropTypes.instanceOf(BookingStep),
    goPrevious: PropTypes.func.isRequired,
    header: PropTypes.string,
    subHeading: PropTypes.node,
    currentUser: modelInstance('scbp_core.clientuser'),
    account: modelInstance('scbp_core.account'),
    onCreateOrLogin: PropTypes.func.isRequired,
    onAccountSetup: PropTypes.func.isRequired,
    clearForm: PropTypes.func,
};
