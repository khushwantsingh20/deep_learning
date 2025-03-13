import { Modal } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';

import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { BookingStatus } from '../../../choiceConstants';

export default function DispatchBookingStatusWidget({ onChange, ...rest }) {
    const wrappedOnChange = newValue => {
        if (BookingStatus.COMPLETED.value === newValue) {
            // Show a confirmation dialog
            // We don't set onCancel because it should be a no-op
            // Only change status if the OK (Complete) button is pressed
            const content = (
                <>
                    <p>You are about to complete this job and invoice the client.</p>
                    <p>
                        It will no longer be possible to modify this booking through the dispatch
                        screen. To modify this booking after completion, use the View Booking
                        screen. This page will now refresh.
                    </p>
                    <p>Are you sure?</p>
                </>
            );
            Modal.confirm({
                content,
                okText: 'Complete',
                onOk() {
                    onChange(newValue);
                },
            });
        } else {
            // Update the status directly if it's not COMPLETED
            onChange(newValue);
        }
    };

    return <ScbpModelForm.Widget onChange={wrappedOnChange} {...rest} />;
}

DispatchBookingStatusWidget.propTypes = {
    onChange: PropTypes.func.isRequired,
};
