import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import PropTypes from 'prop-types';
import { handleErrorResponse } from '@alliance-software/djrad/components/form';
import Form from '@alliance-software/djrad/components/form/Form';
import useAsync from '@alliance-software/djrad/hooks/useAsync';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import { message, Button, Modal, Select } from 'antd';
import React, { useState } from 'react';
import { Form as ReduxForm } from 'redux-form';

import Api from '../../common/api';

const { Option, OptGroup } = Select;

function getEmails(record) {
    return Api.detailRouteGet(record, 'associated-email-addresses');
}

function ResendEmailModal({ record, onClose, title, apiData = {}, endpoint }) {
    const formName = 'resend-email';
    // This endpoint returns data grouped into sections, eg.
    // [
    //    ['Grouping 1', [['John Smith', 'john@example.com']]],
    //    ['Grouping 2', [['Joe', 'joe@example.com'], ['Sam', 'sam@example.com']]],
    // ]
    const { isLoading, response } = useAsync(getEmails, {
        args: [record],
        trigger: useAsync.SHALLOW,
    });

    const { isLoading: isSending, run: send } = useAsync(async email => {
        try {
            await Api.detailRoutePost(record, endpoint, { ...apiData, email });
            onClose();
            message.success(`Email sent to ${email}`);
        } catch (e) {
            handleErrorResponse(e);
        }
    });
    const { selectedEmail, email } = useFormValues(formName, ['selectedEmail', 'email']);
    const formActions = useFormActions(formName);
    if (isLoading) {
        return null;
    }
    const initialValues = {
        selectedEmail: response ? response[0][1][0][1] : null,
    };
    const finalEmail = email || selectedEmail;
    return (
        <Modal
            onCancel={onClose}
            visible
            title={title}
            okText="Send Email"
            okButtonProps={{ disabled: !finalEmail, loading: isSending }}
            onOk={formActions.submit}
        >
            <Form
                name={formName}
                enableReinitialize
                initialValues={initialValues}
                footer={
                    finalEmail && (
                        <Form.Item fullWidth>Email will be sent to {finalEmail}</Form.Item>
                    )
                }
                onSubmit={data => send(data.email || data.selectedEmail)}
                forceConnected
                wrapperComponent={ReduxForm}
            >
                <Form.Item label="Select existing email">
                    <Form.Field
                        name="selectedEmail"
                        widget={
                            <Select style={{ width: '100%' }}>
                                {(response || []).map(([groupLabel, groupEmails]) => (
                                    <OptGroup label={groupLabel} key={groupLabel}>
                                        {groupEmails.map(([label, eml], i) => (
                                            <Option key={i} value={eml}>
                                                {label} ({eml})
                                            </Option>
                                        ))}
                                    </OptGroup>
                                ))}
                            </Select>
                        }
                    />
                </Form.Item>
                <Form.Item label="Or enter any email">
                    <Form.Field name="email" />
                </Form.Item>
            </Form>
        </Modal>
    );
}

ResendEmailModal.propTypes = {
    endpoint: PropTypes.string,
    record: modelInstance(),
    onClose: PropTypes.func.isRequired,
    title: PropTypes.node.isRequired,
    apiData: PropTypes.object,
};

/**
 * Button that shows a modal that allows selection or manual entry of an email address
 * to send an email to. The ViewSet for the specified record must provide the necessary
 * endpoints as described in the prop type documentation below.
 */
export default function ResendEmailButton({
    record,
    title,
    apiData,
    children = 'Resend Email',
    endpoint = 'resend-email',
    ...rest
}) {
    const [isModalOpen, setModalOpen] = useState(false);

    return (
        <>
            <Button type="link" onClick={() => setModalOpen(true)} {...rest}>
                {children}
            </Button>
            {isModalOpen && (
                <ResendEmailModal
                    record={record}
                    onClose={() => setModalOpen(false)}
                    title={title}
                    apiData={apiData}
                    endpoint={endpoint}
                />
            )}
        </>
    );
}

ResendEmailButton.propTypes = {
    /**
     * Record to send email to. The viewset for this must provide 2 detail
     * routes:
     * 'associated-email-addresses' - returns the list of email addressed that
     * the email can be sent to
     * 'resend-email' - sends the email to specified email address. Email will
     * be provided in data under the 'email' key. If `apiData` is specified that
     * will be passed through also.
     */
    record: modelInstance(),
    /**
     * Title for modal
     */
    title: PropTypes.node.isRequired,
    /**
     * Any extra data to send through to the `resend-email` endpoint
     */
    apiData: PropTypes.object,
    /**
     * Endpoint to use. Should exist on the record viewset. Defaults to 'resend-email'.
     */
    endpoint: PropTypes.string,
};
