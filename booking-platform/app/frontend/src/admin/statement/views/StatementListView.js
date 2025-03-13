import { Button, Col, Dropdown, Icon, Menu, Row } from 'antd';
import moment from 'moment';
import React from 'react';

import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import ButtonBar from '@alliance-software/djrad/components/form/ButtonBar';
import FormButton, { FORM_ACTIONS } from '@alliance-software/djrad/components/form/FormButton';
import ResendEmailButton from '../../components/ResendEmailButton';

import StatementGenerateButton from '../components/StatementGenerateButton';
import { Statement } from '../models';
import styles from '../../booking/booking.less';
import ListView from '../../crud/ListView';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { getColumnFieldNames } from '../../../common/data/util';
import { formatAuCurrency } from '../../../common/formatters/numeric';
import { Account } from '../../../common/user/models';
import { buildModelApiUrl } from '../../../common/url';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';

function StatementFilterForm(props) {
    const footer = (
        <ButtonBar
            leftButtons={
                <>
                    <FormButton type="primary" htmlType="submit">
                        Search
                    </FormButton>
                    <FormButton action={FORM_ACTIONS.CLEAR}>Clear</FormButton>
                </>
            }
        />
    );

    return (
        <ScbpModelFilterForm layout="horizontal" footer={footer} {...props}>
            <Row>
                <Col span={6}>
                    <ScbpModelFilterForm.Item
                        className={styles.largeNumberField}
                        labelCol={{ span: 10 }}
                        name="statementNumber"
                        wrapperCol={{ span: 14 }}
                    />
                </Col>
                <Col span={6} offset={1}>
                    <ScbpModelFilterForm.Item
                        labelCol={{ span: 10 }}
                        name="statementDateRange"
                        wrapperCol={{ span: 14 }}
                        label="Period Start Date"
                    />
                </Col>
                <Col span={6} offset={1}>
                    <ScbpModelFilterForm.Item
                        labelCol={{ span: 10 }}
                        name="account"
                        wrapperCol={{ span: 14 }}
                    />
                </Col>
            </Row>
        </ScbpModelFilterForm>
    );
}

export const statementListColumns = [
    'statementNumber',
    'issuedOn',
    {
        dataIndex: 'periodStartDate',
        render(value) {
            return moment(value).format('MMMM Do YYYY');
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
        dataIndex: 'totalCharge',
        render(value) {
            return formatAuCurrency(value);
        },
        align: 'right',
    },
    'paymentMethod',
    {
        dataIndex: 'download',
        render(value, record) {
            const downloadUrl = buildModelApiUrl(Statement, 'download', record.id);
            const menu = (
                <Menu className={styles.actionsMenu}>
                    <Menu.Item key="download">
                        <a href={downloadUrl}>Download</a>
                    </Menu.Item>
                    <Menu.Item key="resend">
                        <ResendEmailButton record={record} title="Resend Statement" />
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
function StatementListView(props) {
    const partialRecordFieldNames = getColumnFieldNames(Statement, statementListColumns);
    const renderFilter = filterProps => <StatementFilterForm {...filterProps} />;
    partialRecordFieldNames.push('accountId');

    return (
        <ListView
            {...props}
            columns={statementListColumns}
            headerButtons={<StatementGenerateButton />}
            partialRecordFieldNames={partialRecordFieldNames}
            renderFilter={renderFilter}
        />
    );
}

export default requirePermissions({ action: 'list', model: Statement })(StatementListView);
