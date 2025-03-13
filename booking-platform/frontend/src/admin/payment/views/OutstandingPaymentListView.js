import { Button, Modal, Skeleton, Table, message, notification } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';

import Form from '@alliance-software/djrad/components/form/Form';
import SelectChoicesWidget from '@alliance-software/djrad/components/form/widgets/SelectChoicesWidget';
import RelatedModelFormatter from '@alliance-software/djrad/components/formatter/RelatedModelFormatter';
import { modelDetailRoute } from '@alliance-software/djrad/actions';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import { modelClass } from '@alliance-software/djrad/prop-types/model';
import { PaymentStatus } from '../../../choiceConstants';

import { Invoice } from '../../invoice/models';
import AdminPageHeader from '../../components/AdminPageHeader';
import ScbpListTableView from '../../../common/data/ScbpListTableView';
import { getColumnFieldNames } from '../../../common/data/util';
import useListView from '../../../common/hooks/useListView';
import { buildModelApiUrl } from '../../../common/url';
import { formatAuCurrency } from '../../../common/formatters/numeric';

import styles from './OutstandingPaymentListView.less';

function OutstandingPaymentActionModal({ hideModal, record, visible }) {
    const formName = `OutstandingPaymentAction${record.modelUUID}`;
    const actionChoices = [['recharge_payment', 'Recharge CC'], ['mark_paid', 'Mark as Paid']];
    const initialValues = { action: 'recharge_payment' };
    const okTexts = {
        recharge_payment: 'Recharge CC',
        mark_paid: 'Mark as Paid',
    };

    const openNotificationWithIcon = (type, action, msg) => {
        notification[type]({
            message: `'${action}' was unsuccessful.`,
            description: (
                <>
                    <p>
                        Your action was unsuccessful. Please regard the following message about the
                        failure:
                    </p>
                    <p>{msg}</p>
                </>
            ),
            duration: 0,
        });
    };

    const { run, isLoading } = useAsyncRedux(modelDetailRoute);
    const { action } = useFormValues(formName, ['action'], initialValues);
    const onOk = () => {
        run('post', record, action).then(r => {
            hideModal();

            if (r.status === PaymentStatus.SUCCESS.value) {
                message.success(`Success! '${okTexts[action]}' has been successful`);
            } else if (
                r.status === PaymentStatus.FAILURE.value ||
                r.status === PaymentStatus.PENDING.value
            ) {
                openNotificationWithIcon('error', okTexts[action], r.message);
            }
        });
    };
    const okText = okTexts[action];

    return (
        <Modal
            confirmLoading={isLoading}
            destroyOnClose
            okText={okText}
            onCancel={hideModal}
            onOk={onOk}
            title="Outstanding Payment Action"
            visible={visible}
        >
            <Form initialValues={initialValues} name={formName} onSubmit={() => {}}>
                <Form.Item>
                    <Form.Field
                        name="action"
                        widget={<SelectChoicesWidget choices={actionChoices} />}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}

OutstandingPaymentActionModal.propTypes = {
    hideModal: PropTypes.func.isRequired,
    record: modelClass('scbp_core.payment').isRequired,
    visible: PropTypes.bool.isRequired,
};

function OutstandingPaymentActionItem({ record }) {
    const [isVisible, setVisible] = useState(false);
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);

    return (
        <>
            <Button onClick={showModal}>Action</Button>
            <OutstandingPaymentActionModal
                hideModal={hideModal}
                record={record}
                visible={isVisible}
            />
        </>
    );
}

OutstandingPaymentActionItem.propTypes = {
    record: modelClass('scbp_core.payment').isRequired,
};

function SingleInvoiceTableView({ record, invoiceItems }) {
    const ids = useMemo(
        () =>
            invoiceItems.hasOwnProperty('map')
                ? invoiceItems.map(item => item.id)
                : invoiceItems.id,
        [invoiceItems]
    );
    return (
        <RelatedModelFormatter
            fieldName="invoices"
            isMany={false}
            record={record}
            relatedModel={Invoice}
            value={ids}
        />
    );
}

SingleInvoiceTableView.propTypes = {
    record: modelClass('scbp_core.paymentrecord').isRequired,
    invoiceItems: PropTypes.oneOfType([
        modelClass('scbp_core.invoice'),
        ImmutablePropTypes.listOf(modelClass('scbp_core.invoice')),
    ]).isRequired,
};

function MultipleInvoiceModal(invoiceItems) {
    const columns = [
        { dataIndex: 'invoiceNumber', title: 'Invoice Number' },
        {
            dataIndex: 'issuedOn',
            title: 'Invoice Date',
            render(value) {
                return value.format('DD/MM/YYYY');
            },
        },
        { dataIndex: 'bookingNumber', title: 'Booking Number' },
        { dataIndex: 'clientUserLabel', title: 'Client' },
        { dataIndex: 'accountLabel', title: 'Account' },
        { dataIndex: 'invoiceTotalAmount', title: 'Total Charge' },
        {
            dataIndex: 'download',
            render(value, record) {
                const url = buildModelApiUrl(Invoice, 'download', record.id);

                return <a href={url}>Download</a>;
            },
        },
    ];
    const table = <Table columns={columns} pagination={false} dataSource={invoiceItems.toJS()} />;

    Modal.info({
        content: table,
        title: `${invoiceItems.size} invoices`,
        width: '50%',
    });
}

function MultipleInvoiceTableItem({ invoiceItems }) {
    return (
        <Button onClick={() => MultipleInvoiceModal(invoiceItems)} type="link">
            {invoiceItems.size} invoices
        </Button>
    );
}

MultipleInvoiceTableItem.propTypes = {
    invoiceItems: ImmutablePropTypes.listOf(modelClass('scbp_core.invoice')).isRequired,
};

export default function OutstandingPaymentListView({ model }) {
    const columns = [
        { dataIndex: 'paymentNumber', title: 'Payment Record Number' },
        {
            className: styles.invoiceItem,
            dataIndex: 'invoices',
            title: 'Invoice Number',
            render(value, record) {
                if (record.invoice) {
                    return <SingleInvoiceTableView invoiceItems={record.invoice} record={record} />;
                } else if (value.size > 1) {
                    return <MultipleInvoiceTableItem invoiceItems={value} />;
                }
                return (
                    <SingleInvoiceTableView
                        invoiceItems={value.first ? value.first() : value}
                        record={record}
                    />
                );
            },
        },
        {
            dataIndex: 'updatedAt',
            title: 'Last Payment Attempt',
            render(value) {
                return moment(value).format('DD/MM/YYYY HH:mm');
            },
        },
        { dataIndex: 'errorMessage', title: 'Message' },
        'account',
        {
            align: 'right',
            dataIndex: 'amount',
            title: 'Total Amount',
            render(value) {
                return formatAuCurrency(value);
            },
        },
        'paymentMethod',
        {
            dataIndex: 'actions',
            render(value, record) {
                return <OutstandingPaymentActionItem record={record} />;
            },
        },
    ];

    const partialRecordFieldNames = getColumnFieldNames(model, columns);
    partialRecordFieldNames.push('invoice');
    const { tableProps, isInitialLoad } = useListView(model, partialRecordFieldNames);
    tableProps.pagination = {
        ...tableProps.pagination,
        showTotal: total => <h2>{total} Failed Payments</h2>,
    };

    return (
        <>
            <AdminPageHeader htmlTitle={model.getHtmlTitle()} header={model.getPageHeader()} />
            {isInitialLoad && <Skeleton />}
            {!isInitialLoad && (
                <ScbpListTableView {...tableProps} columns={columns} className={styles.listTable} />
            )}
        </>
    );
}

OutstandingPaymentListView.propTypes = {
    model: modelClass().isRequired,
};
