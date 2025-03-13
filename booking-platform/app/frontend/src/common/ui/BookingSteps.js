import React from 'react';
import PropTypes from 'prop-types';
import { Steps } from 'antd';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { BookingStep } from '../../app/booking/steps';
import styles from './BookingSteps.less';

const { Step } = Steps;

function BookingSteps({ steps, goToStep, accessibleSteps, current, ...rest }) {
    const onChange = index => {
        const step = steps.get(index);
        if (accessibleSteps.includes(step)) {
            goToStep(step);
        }
    };
    return (
        <Steps
            className={styles.bookingSteps}
            current={current.getStepIndex()}
            onChange={onChange}
            {...rest}
        >
            {(steps.toArray ? steps.toArray() : steps).map(step => (
                <Step
                    key={step.name}
                    title={step.name}
                    className={!accessibleSteps.includes(step) ? styles.disabled : ''}
                />
            ))}
        </Steps>
    );
}

BookingSteps.propTypes = {
    steps: ImmutablePropTypes.listOf(PropTypes.instanceOf(BookingStep)).isRequired,
    goToStep: PropTypes.func.isRequired,
    current: PropTypes.instanceOf(BookingStep).isRequired,
    accessibleSteps: PropTypes.arrayOf(PropTypes.instanceOf(BookingStep)).isRequired,
};

export default BookingSteps;
