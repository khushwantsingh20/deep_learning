import { Button, Col, Dropdown, Icon, Menu, Row } from 'antd';
import React from 'react';

import ActionLink from '@alliance-software/djrad/components/model/ActionLink';

import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import ResendEmailButton from '../../components/ResendEmailButton';
import ListView from '../../crud/ListView';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import { getColumnFieldNames } from '../../../common/data/util';
import { formatAuCurrency } from '../../../common/formatters/numeric';
import { Account } from '../../../common/user/models';
import { Booking } from '../../booking/models';
import { ClientUser } from '../../user/models';
import { Invoice } from '../models';

import styles from './InvoiceListView.less';
import { buildModelApiUrl } from '../../../common/url';

const { Item } = ScbpModelFilterForm;

function InvoiceFilterForm(props) {
    return (
        <ScbpModelFilterForm model={Invoice} layout="horizontal" {...props}>
            <Row>
                <Col span={12}>
                    <Item name="invoiceNumber" />
                    <Item name="clientUser" label="Client" />
                    <Item name="account" />
                    <Item name="paymentMethod" />
                </Col>
                <Col span={12}>
                    <Item name="bookingNumber" />
                    <Item name="issuedOnRange" />
                    <Item name="invoiceTotalAmount" />
                    <Item name="isInterstate" />
                </Col>
            </Row>
        </ScbpModelFilterForm>
    );
}

export const invoicelistColumns = [
    'invoiceNumber',
    'issuedOn',
    {
        dataIndex: 'bookingNumber',
        render(value, record) {
            return (
                <ActionLink action="update" model={Booking} params={{ id: record.bookingId }}>
                    {value}
                </ActionLink>
            );
        },
    },
    {
        dataIndex: 'clientUserLabel',
        title: 'Client',
        render(value, record) {
            return (
                <ActionLink action="detail" model={ClientUser} params={{ id: record.clientUserId }}>
                    {value}
                </ActionLink>
            );
        },
    },
    {
        dataIndex: 'accountLabel',
        title: 'Account',
        render(value, record) {
            return (
                <ActionLink action="detail" model={Account} params={{ id: record.accountId }}>
                    {value}
                </ActionLink>
            );
        },
    },
    {
        dataIndex: 'invoiceTotalAmount',
        title: 'Total Charge',
        render(value) {
            return formatAuCurrency(value);
        },
        className: styles.currencyColumn,
    },
    'paymentMethod',
    {
        dataIndex: 'download',
        render(value, record) {
            const downloadUrl = buildModelApiUrl(Invoice, 'download', record.id);
            const menu = (
                <Menu className={styles.actionsMenu}>
                    <Menu.Item key="download">
                        <a href={downloadUrl}>Download</a>
                    </Menu.Item>
                    <Menu.Item key="resend">
                        <ResendEmailButton record={record} title="Resend Invoice" />
                    </Menu.Item>
                </Menu>
            );

            return (
                <Dropdown overlay={menu} trigger={['click']}>
                    <Button>
                        Actions <Icon type="down" />
                    </Button>
                </Dropdown>
            );
        },
    },
];
function InvoiceListView(props) {
    const partialRecordFieldNames = getColumnFieldNames(Invoice, invoicelistColumns);
    partialRecordFieldNames.push('clientUserId', 'accountId', 'bookingId');
    const renderFilter = filterProps => <InvoiceFilterForm {...filterProps} />;
    return (
        <div className={styles.invoiceList}>
            <ListView
                {...props}
                columns={invoicelistColumns}
                renderFilter={renderFilter}
                partialRecordFieldNames={partialRecordFieldNames}
                sortableFields={[
                    'invoiceNumber',
                    'clientUserLabel',
                    'bookingNumber',
                    'issuedOn',
                    'invoiceTotalAmount',
                    'accountLabel',
                ]}
            />
        </div>
    );
}

export default requirePermissions({ action: 'list', model: Invoice })(InvoiceListView);
