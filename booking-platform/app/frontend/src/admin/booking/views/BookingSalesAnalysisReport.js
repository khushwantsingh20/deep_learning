import cx from 'classnames';
import Breadcrumb from '@alliance-software/djrad/components/breadcrumbs/Breadcrumb';
import useAsync from '@alliance-software/djrad/hooks/useAsync';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import useUrlQueryState from '@alliance-software/djrad/hooks/useUrlQueryState';
import BodyStyle from 'alliance-react/lib/BodyStyle';
import { Spin } from 'antd';
import moment from 'moment';
import React from 'react';
import api from '../../../common/api';

import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import DateWidget from '../../../common/form/DateWidget';
import { formatAuCurrency } from '../../../common/formatters/numeric';
import { Booking } from '../models';
import styles from './BookingSalesAnalysisReport.less';

const { Item } = ScbpModelFilterForm;

function SalesAnalysisFilterForm(props) {
    const formName = 'salesAnalysisFilter';
    const formValues = useFormValues(formName, ['travelOnFrom']);
    const formActions = useFormActions(formName);

    function minimumToDate(current) {
        if (!formValues.travelOnFrom) {
            return false;
        }
        const travelOnFrom = moment(formValues.travelOnFrom);
        return current && current.isBefore(travelOnFrom);
    }
    return (
        <ScbpModelFilterForm
            model={Booking}
            layout="inline"
            {...props}
            name={formName}
            footer={null}
            onChange={() => {
                formActions.submit();
            }}
            className={styles.filterForm}
        >
            <Item label="From">
                <ScbpModelForm.Field
                    name="travelOnFrom"
                    widget={DateWidget}
                    allowClear={false}
                    showToday={false}
                />
            </Item>

            <Item label="To">
                <ScbpModelForm.Field
                    name="travelOnTo"
                    widget={DateWidget}
                    allowClear={false}
                    disabledDate={minimumToDate}
                    showToday={false}
                />
            </Item>
        </ScbpModelFilterForm>
    );
}

function getSalesAnalysisData(filter) {
    const { travelOnFrom, travelOnTo } = filter;
    return api.listRouteGet(Booking, 'sales-analysis-report', {
        travelOnFrom: moment(travelOnFrom)
            .startOf('day')
            .format(),
        travelOnTo: moment(travelOnTo)
            .endOf('day')
            .format(),
    });
}

function SalesAnalysisReport(props) {
    const initialFilterState = {
        travelOnFrom: moment()
            .startOf('month')
            .format(),
        travelOnTo: moment()
            .endOf('month')
            .format(),
    };
    const [filterState, setFilter] = useUrlQueryState(initialFilterState);
    const { isLoading, response } = useAsync(getSalesAnalysisData, {
        trigger: useAsync.SHALLOW,
        args: [filterState],
    });
    const grandTotal = response ? response.reduce((acc, section) => acc + section.total, 0) : 0;

    let indexCounter = 1;

    return (
        <BodyStyle className={styles.salesAnalysis}>
            <div>
                <Breadcrumb to={props.match.url}>Sales Analaysis Report</Breadcrumb>
                <SalesAnalysisFilterForm initialValues={filterState} onSubmit={setFilter} />
                <table className={cx(styles.table, { [styles.loading]: isLoading })}>
                    <thead>
                        <tr>
                            <th colSpan={3}>
                                <div className={styles.tableHead}>
                                    <div>Sales Analysis {isLoading && <Spin />}</div>
                                    <div className={styles.dateRange}>
                                        &nbsp;for period&nbsp;
                                        {moment(filterState.travelOnFrom).format(
                                            'DD/MM/YYYY'
                                        )} to {moment(filterState.travelOnTo).format('DD/MM/YYYY')}
                                    </div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    {response &&
                        response.map((section, i, arr) => {
                            if (i > 0) {
                                indexCounter += arr[i - 1].records.length;
                            }

                            return (
                                <React.Fragment key={i}>
                                    <tbody>
                                        <tr className={styles.sectionLabel}>
                                            <th colSpan={3}>{section.label}</th>
                                        </tr>
                                        <tr className={styles.sectionHeader}>
                                            <th>&nbsp;</th>
                                            <th className="alignCenter">Acct No</th>
                                            <th>Name</th>
                                            <th className={styles.total}>Total Charge</th>
                                        </tr>
                                    </tbody>
                                    <tbody className={styles.rows}>
                                        {section.records.map((record, j) => (
                                            <tr key={j}>
                                                <td className="alignCenter">{indexCounter + j}</td>
                                                <td className={styles.accountNo}>
                                                    {record.accountNo}
                                                </td>
                                                <td>{record.name}</td>
                                                <td className={styles.total}>
                                                    {formatAuCurrency(record.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tbody>
                                        <tr className={styles.footer}>
                                            <th>&nbsp;</th>
                                            <th>&nbsp;</th>
                                            <th>Total of {section.label}</th>
                                            <td>{formatAuCurrency(section.total)}</td>
                                        </tr>
                                        {i === response.length - 1 && (
                                            <tr className={styles.grandTotal}>
                                                <th>&nbsp;</th>
                                                <th>&nbsp;</th>
                                                <th>GRAND TOTAL</th>
                                                <td>{formatAuCurrency(grandTotal)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </React.Fragment>
                            );
                        })}
                </table>
            </div>
        </BodyStyle>
    );
}

export default requirePermissions({ action: 'salesAnalysisReport', model: Booking })(
    SalesAnalysisReport
);
