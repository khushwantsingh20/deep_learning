import { Icon } from 'antd';
import React from 'react';
import PropTypes from 'prop-types';

import { BookingStatus } from '../../../choiceConstants';

export default function BookingStatusIcon({ value }) {
    if (value === BookingStatus.COMPLETED.value) {
        return <Icon title={BookingStatus.COMPLETED.label} type="dollar" />;
    } else if (value === BookingStatus.OFFERED.value) {
        return (
            <Icon title={BookingStatus.OFFERED.label} className="warningColor" type="arrow-right" />
        );
    } else if (value === BookingStatus.KNOCKED_BACK.value) {
        return (
            <Icon title={BookingStatus.KNOCKED_BACK.label} className="errorColor" type="close" />
        );
    } else if (value === BookingStatus.CONFIRMED.value) {
        return (
            <Icon
                title={BookingStatus.CONFIRMED.label}
                className="successColor"
                type="check-square"
            />
        );
    } else if (value === BookingStatus.CLEARED.value) {
        return <Icon title={BookingStatus.CLEARED.label} type="like" />;
    } else if (value === BookingStatus.VARIATION.value) {
        return 'Var';
    } else if (value === BookingStatus.PICKED_UP.value) {
        return <Icon className="primaryColor" title={BookingStatus.PICKED_UP.label} type="car" />;
    } else if (value === BookingStatus.CANCELLED.value) {
        return <Icon title={BookingStatus.CANCELLED.label} className="errorColor" type="stop" />;
    } else if (value === BookingStatus.UNVERIFIED.value) {
        return <Icon title={BookingStatus.UNVERIFIED.label} type="question" />;
    } else if (value === BookingStatus.CHANGED.value) {
        return (
            <Icon title={BookingStatus.CHANGED.label} className="warningColor" type="exclamation" />
        );
    } else if (value === BookingStatus.VERIFIED.value) {
        return '';
    }

    return value;
}

BookingStatusIcon.propTypes = {
    value: PropTypes.number.isRequired,
};
