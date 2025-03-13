import { Button, Col, Dropdown, Icon, Menu, message, Row, Skeleton } from 'antd';
import moment from 'moment';
import { PropTypes } from 'prop-types';
import React, { useCallback } from 'react';

import Form from '@alliance-software/djrad/components/form/Form';
import { modelClass } from '@alliance-software/djrad/prop-types/model';
import ResendEmailButton from '../../components/ResendEmailButton';

import { DriverStatement } from '../models';
import AdminPageHeader from '../../components/AdminPageHeader';
import Api from '../../../common/api';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import ScbpListTableView from '../../../common/data/ScbpListTableView';
import { getColumnFieldNames } from '../../../common/data/util';
import MonthWidget from '../../../common/form/MonthWidget';
import { formatAuCurrency } from '../../../common/formatters/numeric';
import useListView from '../../../common/hooks/useListView';
import { buildModelApiUrl } from '../../../common/url';

import styles from './DriverStatementView.less';

const filterFormName = 'DriverStatementFilterForm';

function DriverStatementFilterForm({ initialValues, onSubmit, ...rest }) {
    /**
     * Displays the month 'filter' form (not really a filter as it doesn't filter out any rows,
     * just updates the amounts displayed)
     */
    const lastMonthReference = moment().subtract(1, 'month');
    initialValues.rawMonth = { month: lastMonthReference.month(), year: lastMonthReference.year() };

    function wrappedOnSubmit(formValues, ...restParams) {
        // Unpack the month/year values - they don't serialize very well
        const { rawMonth } = formValues;
        formValues.year = moment.isMoment(rawMonth) ? rawMonth.year() : rawMonth.year;
        // Moment.js month is 0-based, but server expects 1-based month - make that correction here
        formValues.month = (moment.isMoment(rawMonth) ? rawMonth.month() : rawMonth.month) + 1;
        onSubmit(formValues, ...restParams);
    }

    function handleAllStatementClick() {
        const { month, year } = initialValues;
        Api.listRouteGet(DriverStatement, 'send_all', { month, year }, {}).then(
            () =>
                message.success(
                    'Driver statement emails queued for sending. Please allow up to 30 minutes for sending.'
                ),
            () => message.error('There was a problem generating statements. Please try again.')
        );
    }

    function handleRgiSummaryClick() {
        const { month, year } = initialValues;
        Api.listRouteGet(DriverStatement, 'rgi_statement', { month, year }, {}).then(response => {
            message.success(
                <div>
                    RGI Summary sent to Google Drive.
                    <br />
                    Click{' '}
                    <a href={response.spreadsheetUrl} rel="noopener noreferrer" target="_blank">
                        here
                    </a>{' '}
                    to go to the spreadsheet.
                </div>
            );
        });
    }

    return (
        <Row className={styles.filterRow}>
            <Col span={2}>Filters:</Col>
            <Col span={6}>
                <Form
                    initialValues={initialValues}
                    layout="horizontal"
                    name={filterFormName}
                    onChange={wrappedOnSubmit}
                    onSubmit={wrappedOnSubmit}
                    {...rest}
                >
                    <Form.Item
                        className={styles.filterItem}
                        label="Month"
                        labelCol={{ span: 4 }}
                        wrapperCol={{ span: 20 }}
                    >
                        <Form.Field mode="month" name="rawMonth" widget={MonthWidget} />
                    </Form.Item>
                </Form>
            </Col>
            <Col span={4}>
                <Button onClick={handleRgiSummaryClick}>Generate RGI Summary Spreadsheet</Button>
            </Col>
            <Col span={12} className={styles.filterLastColumn}>
                <Button onClick={handleAllStatementClick}>
                    Email All Driver Monthly Statements
                </Button>
            </Col>
        </Row>
    );
}

DriverStatementFilterForm.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
};

function RawDriverStatementView(props) {
    const { model } = props;
    const partialRecordFieldNames = getColumnFieldNames(DriverStatement, [
        'driverNo',
        'name',
        'earningsAmount',
        'outOfPocketAmount',
        'collectedAmount',
    ]);

    const { tableProps, filterProps, isInitialLoad } = useListView(
        model,
        partialRecordFieldNames,
        {}
    );

    const showTotal = useCallback(() => {
        /* Why can we use filterProps.initialValues here? Because it's populated from the query string which
            is updated whenever the user selects a new month.
            Note that I subtract a month to correct for the month addition in the 'filter' submission
         */
        const referenceMoment = moment({
            month: filterProps.initialValues.month - 1,
            year: filterProps.initialValues.year,
        });
        return <h2>Driver Statements Summary for {referenceMoment.format('MMMM YYYY')}</h2>;
    }, [filterProps]);

    const columns = [
        { dataIndex: 'driverNo', title: 'Driver No.', width: 100 },
        'name',
        {
            align: 'right',
            dataIndex: 'earningsAmount',
            title: 'Earnings',
            width: 200,
            render(value) {
                return formatAuCurrency(value);
            },
        },
        {
            align: 'right',
            dataIndex: 'outOfPocketAmount',
            title: 'Out of Pocket',
            width: 200,
            render(value) {
                return formatAuCurrency(value);
            },
        },
        {
            align: 'right',
            dataIndex: 'collectedAmount',
            title: 'Collected',
            width: 200,
            render(value) {
                return formatAuCurrency(value);
            },
        },
        {
            align: 'right',
            dataIndex: 'download',
            width: 250,
            render(value, record) {
                const { month, year } = filterProps.initialValues;
                const downloadUrl = `${buildModelApiUrl(
                    DriverStatement,
                    'download',
                    record.id
                )}?month=${month}&year=${year}`;

                const menu = (
                    <Menu className={styles.actionsMenu}>
                        <Menu.Item key="download">
                            <a href={downloadUrl}>Download</a>
                        </Menu.Item>
                        <Menu.Item key="resend">
                            <ResendEmailButton
                                record={record}
                                title={`Resend Driver Statement for ${month}/${year}`}
                                apiData={{ month: Number(month), year: Number(year) }}
                            />
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

    return (
        <>
            <AdminPageHeader htmlTitle={model.getHtmlTitle()} header={model.getPageHeader()} />
            <DriverStatementFilterForm {...filterProps} />
            {isInitialLoad && <Skeleton />}
            {!isInitialLoad && (
                <ScbpListTableView
                    {...tableProps}
                    showTotal={showTotal}
                    columns={columns}
                    className={styles.listTable}
                    sortableFields={[
                        'driverNo',
                        'name',
                        'earningsAmount',
                        'outOfPocketAmount',
                        'collectedAmount',
                    ]}
                />
            )}
        </>
    );
}

RawDriverStatementView.propTypes = {
    model: modelClass('scbp_core.driverstatement'),
};

export default requirePermissions({ action: 'list', model: DriverStatement })(
    RawDriverStatementView
);
