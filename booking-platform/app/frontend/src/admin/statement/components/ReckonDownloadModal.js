import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import { Modal } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';

import Form from '@alliance-software/djrad/components/form/Form';

import { Statement } from '../models';
import { toQueryString } from '../../../common/api';
import MonthWidget from '../../../common/form/MonthWidget';
import { buildModelApiUrl } from '../../../common/url';

export default function ReckonDownloadModal({ closeModal, visible }) {
    const referenceDate = moment().subtract(1, 'month');
    const initialValues = { period: { month: referenceDate.month(), year: referenceDate.year() } };

    const formName = 'ReckonDownloadForm';
    const formActions = useFormActions(formName);

    return (
        <Modal
            destroyOnClose
            okButtonProps={{ style: { marginLeft: '10px', top: '1px' } }}
            okText="Download Data"
            onCancel={closeModal}
            onOk={() => {
                formActions.submit();
                closeModal();
            }}
            title="Download Data for Reckon"
            visible={visible}
        >
            <Form
                initialValues={initialValues}
                layout="horizontal"
                name={formName}
                onSubmit={({ period }) => {
                    window.location.href =
                        buildModelApiUrl(Statement, 'reckon-download') +
                        '?' +
                        toQueryString(period);
                }}
            >
                <Form.Item label="Period">
                    <Form.Field name="period" widget={MonthWidget} />
                </Form.Item>
            </Form>
        </Modal>
    );
}

ReckonDownloadModal.propTypes = {
    closeModal: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired,
};
