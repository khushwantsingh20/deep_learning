import { Button, Col, Row, Skeleton } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';

import { RangeReduxFormField } from '@alliance-software/djrad/model/fields/RangeField';
import { modelClass } from '@alliance-software/djrad/prop-types/model';

import { DriverRevenue } from '../models';
import AdminPageHeader from '../../components/AdminPageHeader';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import ScbpListTableView from '../../../common/data/ScbpListTableView';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import { getColumnFieldNames } from '../../../common/data/util';
import DateRangeSplitWidget from '../../../common/form/DateRangeSplitWidget';
import { formatAuCurrency } from '../../../common/formatters/numeric';
import useListView from '../../../common/hooks/useListView';
import { buildModelApiUrl } from '../../../common/url';

import styles from './DriverStatementView.less';

function datesToRange(sdate, edate) {
    return {
        lower: sdate ? moment(sdate) : moment().startOf('month'),
        upper: moment(edate),
    };
}

function DriverRevenueFilterForm({ initialValues, onSubmit, ...rest }) {
    /**
     * Displays the date range 'filter' form (not really a filter as it doesn't filter out any rows,
     * just updates the amounts displayed)
     */
    const { sdate, edate, ordering } = initialValues;
    initialValues.dateRange = datesToRange(sdate, edate);
    const disableDate = date => moment().isBefore(date);

    const wrapOnSubmit = data => {
        const { dateRange, ...dataRest } = data;
        let transformedDateRange = {};
        if (dateRange && dateRange.upper && dateRange.lower) {
            transformedDateRange = {
                sdate: dateRange.lower.format('YYYY-MM-DD'),
                edate: dateRange.upper.format('YYYY-MM-DD'),
            };
        }
        onSubmit({ ...dataRest, ...transformedDateRange });
    };

    const url = `${buildModelApiUrl(
        DriverRevenue,
        'download'
    )}?sdate=${sdate}&edate=${edate}&ordering=${ordering}`;

    return (
        <Row className={styles.filterRow}>
            <Col span={2}>
                <strong>Filters:</strong>
            </Col>
            <Col span={14}>
                <ScbpModelFilterForm
                    className={styles.revenueFilter}
                    footer={null}
                    initialValues={initialValues}
                    layout="horizontal"
                    name="DriverRevenueDriverFilter"
                    onChange={wrapOnSubmit}
                    onSubmit={wrapOnSubmit}
                    {...rest}
                >
                    <Row>
                        <Col span={12}>
                            <ScbpModelFilterForm.Item label="Dates">
                                <ScbpModelFilterForm.Field
                                    disableDate={disableDate}
                                    isUserDefinedField
                                    name="dateRange"
                                    reduxFormFieldComponent={RangeReduxFormField}
                                    widget={DateRangeSplitWidget}
                                />
                            </ScbpModelFilterForm.Item>
                        </Col>
                        <Col span={12}>
                            <ScbpModelFilterForm.Item name="driver" />
                        </Col>
                    </Row>
                </ScbpModelFilterForm>
            </Col>
            <Col span={8} className={styles.filterLastColumn}>
                <Button href={url}>Print Report</Button>
            </Col>
        </Row>
    );
}

DriverRevenueFilterForm.propTypes = {
    initialValues: PropTypes.shape({
        sdate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(moment)]),
        edate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(moment)]),
    }).isRequired,
    onSubmit: PropTypes.func.isRequired,
};

function RawDriverRevenueView(props) {
    const { model } = props;
    const partialRecordFieldNames = getColumnFieldNames(DriverRevenue, [
        'driverNo',
        'name',
        'daysWorked',
        'weekendDaysWorked',
        'bookingCount',
        'outOfHoursBookingCount',
        'earningsAmount',
        'dailyAverageRevenue',
        'bookingAverageRevenue',
    ]);

    const { tableProps, filterProps, isInitialLoad, extraData } = useListView(
        model,
        partialRecordFieldNames
    );

    const columns = [
        {
            dataIndex: 'driverNo',
            title: 'Driver No.',
            width: 110,
        },
        { dataIndex: 'name', title: 'Driver Name', width: 300 },
        { align: 'right', dataIndex: 'daysWorked', width: 130 },
        { align: 'right', dataIndex: 'weekendDaysWorked', title: 'Weekend Days', width: 130 },
        { align: 'right', dataIndex: 'bookingCount', title: 'Bookings Serviced', width: 160 },
        { align: 'right', dataIndex: 'outOfHoursBookingCount', title: 'Out of Hours', width: 130 },
        {
            align: 'right',
            dataIndex: 'earningsAmount',
            title: 'Earnings',
            render(value) {
                return formatAuCurrency(value);
            },
            width: 120,
        },
        {
            align: 'right',
            dataIndex: 'dailyAverageRevenue',
            title: 'Avg/Day',
            render(value) {
                return formatAuCurrency(value);
            },
            width: 120,
        },
        {
            align: 'right',
            dataIndex: 'bookingAverageRevenue',
            title: 'Avg Job Value',
            render(value) {
                return formatAuCurrency(value);
            },
            width: 130,
        },
    ];
    const sortableFields = [
        'driverNo',
        'name',
        'daysWorked',
        'weekendDaysWorked',
        'bookingCount',
        'outOfHoursBookingCount',
        'earningsAmount',
        'dailyAverageRevenue',
        'bookingAverageRevenue',
    ];

    const { initialValues = {} } = filterProps;
    const showTotal = useCallback(() => {
        const { lower: sdate, upper: edate } = datesToRange(
            initialValues.sdate,
            initialValues.edate
        );
        const format = 'ddd D MMM YYYY';
        return (
            <h2 className={styles.driverSummaryTitle}>
                Driver Revenue Summary for{' '}
                <span>
                    {sdate.format(format)} - {edate.format(format)}
                </span>
            </h2>
        );
    }, [initialValues.sdate, initialValues.edate]);
    if (tableProps.pagination) {
        tableProps.pagination.showTotal = showTotal;
    } else {
        tableProps.pagination = { showTotal };
    }

    return (
        <div className={styles.driverRevenueView}>
            <AdminPageHeader htmlTitle={model.getHtmlTitle()} header={model.getPageHeader()} />
            <DriverRevenueFilterForm {...filterProps} />
            {isInitialLoad && <Skeleton />}
            {!isInitialLoad && (
                <ScbpListTableView
                    {...tableProps}
                    columns={columns}
                    sortableFields={sortableFields}
                    pagination={false}
                    className={styles.listTable}
                    footer={() => (
                        <table>
                            <colgroup>
                                <col style={{ width: '110px' }} />
                                <col style={{ width: '300px' }} />
                                <col style={{ width: '130px' }} />
                                <col style={{ width: '130px' }} />
                                <col style={{ width: '160px' }} />
                                <col style={{ width: '130px' }} />
                                <col style={{ width: '120px' }} />
                                <col style={{ width: '120px' }} />
                                <col style={{ width: '130px' }} />
                            </colgroup>
                            <tfoot>
                                <tr>
                                    <th>Totals</th>
                                    <td>&nbsp;</td>
                                    <td style={{ textAlign: 'right' }}>
                                        {extraData.totalDaysWorked}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {extraData.totalWeekendsWorked}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {extraData.totalBookings}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {extraData.totalOutOfHours}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {formatAuCurrency(extraData.totalEarnings)}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {formatAuCurrency(extraData.dailyAverageAverage)}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {formatAuCurrency(extraData.bookingAverageAverage)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                />
            )}
        </div>
    );
}

RawDriverRevenueView.propTypes = {
    model: modelClass('scbp_core.driverrevenue'),
};

export default requirePermissions({ action: 'list', model: DriverRevenue })(RawDriverRevenueView);
