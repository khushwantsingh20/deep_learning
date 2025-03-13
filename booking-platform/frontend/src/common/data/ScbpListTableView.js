import React from 'react';
import { Badge, Button, Dropdown, Icon, Menu } from 'antd';
import cx from 'classnames';
import DjradPropTypes from '@alliance-software/djrad/prop-types';
import ListTableView from '@alliance-software/djrad/components/model/ListTableView'; // eslint-disable-line
import PropTypes from 'prop-types';

import styles from './ScbpListTableView.less';

export function bulkActionsProp(props, propName, componentName) {
    PropTypes.checkPropTypes(
        { bulkActions: PropTypes.arrayOf(PropTypes.string) },
        props,
        propName,
        componentName
    );
    if (props[propName]) {
        if (!props.onBulkAction) {
            return new Error("When using 'bulkActions' you must also specify 'onBulkAction'");
        }
        if (!props.rowSelection) {
            return new Error(
                "When using 'bulkActions' you must also specify 'rowSelection'. See https://ant.design/components/table/#rowSelection"
            );
        }
    }
    return null;
}

/**
 * Wrapper for DJRad [ListTableView](#listtableview) that provides client specific layout and and styles
 */
export default function ScbpListTableView(props) {
    const {
        model,
        data,
        bulkActions,
        onBulkAction,
        label = model._meta.label,
        labelPlural = model._meta.labelPlural,
        pagination,
        className,
        showTotal,
        ...rest
    } = props;

    const tableProps = {
        pagination:
            pagination === false
                ? false
                : {
                      position: 'both',
                      showTotal:
                          showTotal ||
                          (total => (
                              <h2>{`${total.toLocaleString()} ${
                                  total === 1 ? label : labelPlural
                              }`}</h2>
                          )),
                      ...pagination,
                  },
        ...rest,
    };

    const table = (
        <ListTableView
            {...tableProps}
            data={data && data.toArray ? data.toArray() : data}
            className={cx(styles.listTableView, className)}
            model={model}
        />
    );

    if (bulkActions) {
        const { selectedRowKeys = [] } = props.rowSelection || {};
        const bulkMenu = (
            <Menu onClick={onBulkAction}>
                {bulkActions.map(action => (
                    <Menu.Item key={action}>{action}</Menu.Item>
                ))}
            </Menu>
        );
        return (
            <>
                <div style={{ textAlign: 'right' }}>
                    <Dropdown
                        overlay={bulkMenu}
                        disabled={selectedRowKeys.length === 0}
                        trigger={['click']}
                    >
                        <Button>
                            Bulk Actions <Badge count={selectedRowKeys.length} />{' '}
                            <Icon type="down" />
                        </Button>
                    </Dropdown>
                </div>
                {table}
            </>
        );
    }

    return table;
}

ScbpListTableView.propTypes = {
    /** The model being listed **/
    model: DjradPropTypes.modelClass(),
    /** The label for the total number of records being listed **/
    label: PropTypes.string,
    /** The label plural for the total number of records being listed **/
    labelPlural: PropTypes.string,
    /** A list of bulk actions render for acting upon select rows **/
    bulkActions: bulkActionsProp,
    /** Function to call when one of bulkActions is selected */
    onBulkAction: PropTypes.func,
    columns: PropTypes.array,
    loading: PropTypes.bool,
    rowSelection: PropTypes.object,
    pagination: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.shape({
            showSizeChanger: PropTypes.bool,
            defaultPageSize: PropTypes.number,
            onChange: PropTypes.func,
            pageSize: PropTypes.number,
            current: PropTypes.number,
            total: PropTypes.number,
        }),
    ]),
    className: PropTypes.string,
    /**
     * Function to render total on pagination. Defaults to showing the total number with plural of the model, eg. 10 Invoices
     */
    showTotal: PropTypes.func,
};
