import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import { Modal, Spin } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';
import { Form as ReduxForm, SubmissionError } from 'redux-form';

import { modelDetailRoute } from '@alliance-software/djrad/actions';
import { handleErrorResponse } from '@alliance-software/djrad/components/form';
import ButtonBar from '@alliance-software/djrad/components/form/ButtonBar';
import TextAreaWidget from '@alliance-software/djrad/components/form/widgets/TextAreaWidget';
import Form from '@alliance-software/djrad/components/form/Form';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { appendToUrl } from '@alliance-software/djrad/util/url';
import useKeyPress from '../hooks/useKeyPress';

function DispatchSendToDriverForm({ booking, driver, onCancel, driverUrl, visible }) {
    // Set initial values and form validators
    const bookingTravelOn = moment(booking.travelOn);
    const defaultMessage = `${booking.bookingNumber} ${bookingTravelOn.format(
        'YYYY.MM.DD HHmm'
    )}hrs ${booking.fromAddress.suburb}-${
        booking.destinationAddress ? booking.destinationAddress.suburb : 'As Directed'
    } View Job ${driverUrl}`;
    const initialValues = {
        message: defaultMessage,
        mobile: driver.mobile,
        email: driver.email,
        subject: `Booking ${booking.bookingNumber}`,
    };
    const validateMobile = value => value.match(/^[\d -]*$/);
    const { run } = useAsyncRedux(data =>
        modelDetailRoute('post', booking, 'send_to_driver', data)
    );
    // Form handlers
    const formName = 'dispatchSendToDriverForm';
    const { message } = useFormValues(formName, ['message'], initialValues);
    const sendToDriver = ({ _submitAction: type, ...rest }) => {
        const data = {
            type,
            driverId: driver.id,
            ...rest,
        };

        return run(data).then(
            () => onCancel(),
            apiError => {
                if (apiError && apiError.response && apiError.response.detail) {
                    throw new SubmissionError({
                        _error: apiError.response.detail,
                    });
                }
                handleErrorResponse(apiError);
            }
        );
    };

    const footer = (
        <ButtonBar
            leftButtons={
                <Form.Button
                    action="email"
                    submitOnClick
                    autoFocus
                    id="email-driver-and-submit-button"
                >
                    Email driver and close
                </Form.Button>
            }
            rightButtons={
                <Form.Button action="sms" submitOnClick id="sms-driver-and-submit-button">
                    SMS driver and close
                </Form.Button>
            }
        />
    );

    useKeyPress(
        'ArrowLeft',
        () => {
            document.getElementById('email-driver-and-submit-button').focus();
        },
        !visible
    );
    useKeyPress(
        'ArrowRight',
        () => {
            document.getElementById('sms-driver-and-submit-button').focus();
        },
        !visible
    );

    return (
        <Form
            forceConnected
            footer={footer}
            initialValues={initialValues}
            layout="horizontal"
            name={formName}
            onSubmit={sendToDriver}
            validate={data => {
                if (data.mobile && !validateMobile(data.mobile)) {
                    return { mobile: 'Invalid mobile number' };
                }
                return {};
            }}
            wrapperComponent={ReduxForm}
        >
            <Form.Item label="Driver No" fieldProps={{ tabIndex: -1 }}>
                {driver.driverNo}
            </Form.Item>
            <Form.Item label="Driver Name" fieldProps={{ tabIndex: -1 }}>
                {driver.__str__}
            </Form.Item>
            <Form.Item label="Mobile No">
                <Form.Field name="mobile" tabIndex={-1} />
            </Form.Item>
            <Form.Item label="Email">
                <Form.Field name="email" tabIndex={-1} />
            </Form.Item>
            <Form.Item label="Subject">
                <Form.Field name="subject" tabIndex={-1} />
            </Form.Item>
            <Form.Item label="Message">
                <Form.Field name="message" widget={TextAreaWidget} tabIndex={-1} />
            </Form.Item>
            <Form.Item label={false}>Message characters: {(message || '').length}</Form.Item>
        </Form>
    );
}

DispatchSendToDriverForm.propTypes = {
    booking: modelInstance('scbp_core.dispatch').isRequired,
    driver: modelInstance('scbp_core.driveruser').isRequired,
    onCancel: PropTypes.func.isRequired,
    driverUrl: PropTypes.string,
    visible: PropTypes.bool,
};

export default function DispatchSendToDriverModal({ booking, onCancel, visible, ...modalProps }) {
    // We only need to refetch driver if if booking or driver value changes. Any other changes
    // on booking are irrelevant and just cause modal to close then re-open (due to loading state
    // change).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const cachedBooking = useMemo(() => booking, [booking.id, booking.driver]);
    const fetchDriver = useCallback(() => modelDetailRoute('get', cachedBooking, 'get_driver'), [
        cachedBooking,
    ]);
    const { recordsByModelId, isLoading, error, extraData } = useGetModel(
        'scbp_core.driveruser',
        booking.driver,
        {
            action: fetchDriver,
        }
    );
    let record;
    // Because the action we use is a modelDetailRoute against booking no `record` will
    // be returned by useGetModel but will be available in recordsByModelId
    if (recordsByModelId && recordsByModelId['scbp_core.driveruser']) {
        record = recordsByModelId['scbp_core.driveruser'].find(
            r => r.getId() === Number(booking.driver)
        );
    }
    if (error) {
        throw error;
    }
    if (isLoading) {
        return <Spin />;
    }
    const { baseUrl } = window.__APP_CONTEXT__;
    const url = appendToUrl(baseUrl, ['driver', extraData.urlToken]);

    return (
        <Modal footer={null} onCancel={onCancel} visible={visible} {...modalProps}>
            {visible && (
                <DispatchSendToDriverForm
                    booking={booking}
                    driver={record}
                    onCancel={onCancel}
                    driverUrl={url}
                    visible={visible}
                />
            )}
        </Modal>
    );
}

DispatchSendToDriverModal.propTypes = {
    booking: modelInstance('scbp_core.dispatch').isRequired,
    onCancel: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired,
};
