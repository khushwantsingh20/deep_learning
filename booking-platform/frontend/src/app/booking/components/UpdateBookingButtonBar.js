import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import FormButton from '@alliance-software/djrad/components/form/FormButton';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import { Icon } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import { Booking } from '../../user/models';
import { BookingStep } from '../steps';
import styles from './CreateBookingController.less';

export default function UpdateBookingButtonBar({ currentStep, goPrevious, header }) {
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
                <h2 className={styles.heading}>
                    <span className={styles.headingStepIndex}>
                        Step {currentStep.getStepIndex() + 1} of {currentStep.getCount()}
                    </span>
                    {header}
                </h2>
            )}
            {currentStep.isFirst() && (
                <ActionLink
                    linkComponent={ButtonLink}
                    action="list"
                    model={Booking}
                    style={{ marginLeft: 0 }}
                >
                    Cancel
                </ActionLink>
            )}
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
            {currentStep.isLoginRequiredToContinue() && !header && (
                <FormButton type="primary" htmlType="submit" showLoading>
                    Save changes to this booking <Icon type="right" />
                </FormButton>
            )}
        </div>
    );
}

UpdateBookingButtonBar.propTypes = {
    currentStep: PropTypes.instanceOf(BookingStep),
    goPrevious: PropTypes.func.isRequired,
    header: PropTypes.string,
};
