import { Modal, Spin } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';

import { handleErrorResponse } from '@alliance-software/djrad/components/form/errors';
import Form from '@alliance-software/djrad/components/form/Form';
import ChoicesWidget from '@alliance-software/djrad/components/form/widgets/ChoicesWidget';
import DateRangeWidget from '@alliance-software/djrad/components/form/widgets/DateRangeWidget';
import ModelLookupWidget from '@alliance-software/djrad/components/form/widgets/ModelLookupWidget';
import SelectWidget from '@alliance-software/djrad/components/form/widgets/SelectWidget';
import TextAreaWidget from '@alliance-software/djrad/components/form/widgets/TextAreaWidget';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import { RangeReduxFormField } from '@alliance-software/djrad/model/fields/RangeField';

import { Statement } from '../models';
import { PaymentMethodType } from '../../../choiceConstants';
import Api from '../../../common/api';
import { Account } from '../../../common/user/models';

function AccountLookupWidget(props) {
    const { multiple, fetching, items, ...rest } = props;
    return (
        <SelectWidget
            mode={multiple ? 'multiple' : null}
            labelInValue
            showSearch
            filterOption={false}
            notFoundContent={fetching ? <Spin size="small" /> : <em>No results found</em>}
            onDropdownVisibleChange={open => !open && props.clearSearch()}
            {...rest}
        >
            <SelectWidget.Option key="all" value="all">
                All Accounts
            </SelectWidget.Option>
            {items.map(entity => (
                <SelectWidget.Option key={entity.id} value={entity.id}>
                    {entity.label}
                </SelectWidget.Option>
            ))}
        </SelectWidget>
    );
}

AccountLookupWidget.propTypes = {
    clearSearch: PropTypes.func,
    fetching: PropTypes.bool,
    items: PropTypes.array,
    multiple: PropTypes.bool,
};

export default function StatementGenerateModal({ closeModal, visible }) {
    // Form and hook setup
    const formName = 'CreateStatementForm';
    const formActions = useFormActions(formName);
    const initialDateReference = moment().subtract(1, 'month');
    const initialValues = {
        account: 'all',
        dateRange: {
            lower: moment(initialDateReference).startOf('month'),
            upper: moment(initialDateReference).endOf('month'),
        },
        paymentMethod: '',
        customMessage: '',
    };
    const { paymentMethod } = useFormValues(formName, ['paymentMethod'], initialValues);

    // OK button parameters
    // parseInt is used because ChoicesWidget onBlur converts value to string
    const okText =
        parseInt(paymentMethod, 10) === PaymentMethodType.INVOICE.value
            ? 'Generate and Email'
            : 'Generate, Email, & Charge CCs';
    const okProps = { style: { width: '50%' } };

    // Modal event handlers
    const handleOk = () => {
        formActions.submit();
    };
    const handleSubmit = values => {
        // Massage the data to optimize server handling
        if (values.account === 'all') {
            values.account = '';
        }
        // Fix time zone issue with the date range (UTC+ timezones make lower one day too early,
        // UTC- timezones make upper one day too late)
        values.dateRange.lower = moment(values.dateRange.lower).format('YYYY-MM-DD');
        values.dateRange.upper = moment(values.dateRange.upper).format('YYYY-MM-DD');
        // Submit the request
        return Api.listRoutePost(Statement, 'create', values, { hasCustomResponse: true })
            .then(() => closeModal())
            .catch(error => handleErrorResponse(error));
    };

    return (
        <Modal
            destroyOnClose
            okButtonProps={okProps}
            okText={okText}
            onCancel={closeModal}
            onOk={handleOk}
            title="Generate End of Month Statements"
            visible={visible}
        >
            <Form
                initialValues={initialValues}
                layout="horizontal"
                name="CreateStatementForm"
                onSubmit={handleSubmit}
            >
                <Form.Item label="Payment Method">
                    <Form.Field
                        name="paymentMethod"
                        widget={
                            <ChoicesWidget
                                choices={[
                                    ['', 'Any'],
                                    [PaymentMethodType.CREDIT_CARD.value, 'Credit Card'],
                                    [PaymentMethodType.INVOICE.value, 'Invoice'],
                                ]}
                            />
                        }
                    />
                </Form.Item>
                <Form.Item label="Account">
                    <Form.Field
                        name="account"
                        widget={
                            <ModelLookupWidget
                                baseFilter={{ paymentMethod }}
                                labelFieldName="__str__"
                                lookupWidget={AccountLookupWidget}
                                model={Account}
                                supportsServerSideSearch
                            />
                        }
                    />
                </Form.Item>
                <Form.Item label="Period">
                    <Form.Field
                        name="dateRange"
                        reduxFormFieldComponent={RangeReduxFormField}
                        separator="To"
                        widget={DateRangeWidget}
                    />
                </Form.Item>
                <Form.Item label="Custom Message">
                    <Form.Field
                        name="customMessage"
                        widget={<TextAreaWidget autosize={{ minRows: 3 }} />}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}

StatementGenerateModal.propTypes = {
    closeModal: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired,
};
