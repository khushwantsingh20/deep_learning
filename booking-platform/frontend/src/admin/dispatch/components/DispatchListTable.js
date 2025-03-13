import { Empty, Skeleton } from 'antd';
import cx from 'classnames';
import { List } from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { AutoSizer, Column, defaultTableHeaderRenderer, Table } from 'react-virtualized';

import 'react-virtualized/styles.css';

import styles from '../dispatch.less';

/**
 * Takes the sort order string returned by Djrad and converts it into sort options expected
 * by react-virtualized table
 * @param sortedField
 * @returns {{sortDirection: null, sortBy: null}|{sortDirection: string, sortBy: *}}
 */
function parseSortedField(sortedField) {
    if (!sortedField) {
        return { sortBy: null, sortDirection: null };
    } else if (sortedField.match(/^-.*$/)) {
        return { sortBy: sortedField.replace(/^-/, ''), sortDirection: 'DESC' };
    }
    return { sortBy: sortedField, sortDirection: 'ASC' };
}

export default function DispatchListTable({
    columns,
    data,
    isLoading,
    onChange,
    onRowClick,
    selectedRow,
    sortedField,
}) {
    // Set class names for table rows
    const rowClassName = ({ index }) => {
        if (index >= 0) {
            const record = data.get(index);
            const categoryClassName = styles[`${record.dispatchCategory}Row`];
            if (record.id === selectedRow) {
                return cx(categoryClassName, styles.selectedRow);
            }
            return categoryClassName;
        }
        return styles.dispatchListHeader;
    };

    // Sort configuration
    const { sortBy, sortDirection } = parseSortedField(sortedField);
    const sort = ({ sortBy: newSortBy, sortDirection: newSortDirection }) => {
        // We cycle through directions - ASC, then DESC, then null (default order)
        // Changing the field resets the cycle
        const directionMap = { ASC: 'ascend', DESC: 'descend' };
        const newSort = { field: null, order: null };
        if (sortBy !== newSortBy || sortDirection !== 'DESC') {
            newSort.field = newSortBy;
            newSort.order = directionMap[newSortDirection];
        }
        onChange(false, {}, newSort);
    };

    // Column render helper
    const headerRenderer = ({ columnData, ...props }) => {
        if (columnData.headerClassName) {
            return (
                <div className={cx(columnData.headerClassName)}>
                    {defaultTableHeaderRenderer(props)}
                </div>
            );
        }
        return defaultTableHeaderRenderer(props);
    };

    const renderedColumns = columns.map(column => {
        const { align, className, ...columnProps } = column;
        const rightAlignClassName = align === 'right' ? styles.alignRight : '';
        const columnData = {
            headerClassName: rightAlignClassName,
        };
        const trueClassName = cx(className, rightAlignClassName);
        return (
            <Column
                cellRenderer={({ cellData, rowData }) =>
                    column.render ? column.render(cellData, rowData) : cellData
                }
                className={trueClassName}
                columnData={columnData}
                headerRenderer={headerRenderer}
                key={columnProps.dataKey}
                {...columnProps}
            />
        );
    });

    // Row height
    // Default of 30 set to allow convoy and run number fields to display fully
    // Option length over 35 indicates it wraps to three lines which requires row height of 60
    const rowHeight = ({ index }) => (data.get(index).options.length > 35 ? 60 : 30);

    // Final render
    return (
        <AutoSizer>
            {({ height, width }) => (
                <Table
                    height={height}
                    headerHeight={30}
                    noRowsRenderer={() => (isLoading ? <Skeleton /> : <Empty />)}
                    onRowClick={({ rowData }) => onRowClick(rowData)}
                    rowClassName={rowClassName}
                    rowCount={data ? data.size : 0}
                    rowGetter={({ index }) => data.get(index)}
                    rowHeight={rowHeight}
                    sort={sort}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    width={width}
                >
                    {renderedColumns}
                </Table>
            )}
        </AutoSizer>
    );
}

DispatchListTable.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.object).isRequired,
    data: PropTypes.instanceOf(List).isRequired,
    isLoading: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    onRowClick: PropTypes.func,
    selectedRow: PropTypes.number,
    sortedField: PropTypes.string,
};
