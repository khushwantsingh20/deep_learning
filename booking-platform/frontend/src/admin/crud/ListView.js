import { Skeleton } from 'antd';
import React from 'react';
import PropTypes from 'prop-types';
import { modelClass } from '@alliance-software/djrad/prop-types/model';
import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';

import requirePermissions from '../../common/auth/hoc/requirePermissions';
import ScbpListTableView, { bulkActionsProp } from '../../common/data/ScbpListTableView';
import ScbpModelFilterForm from '../../common/data/ScbpModelFilterForm';
import { getColumnFieldNames } from '../../common/data/util';
import useListView from '../../common/hooks/useListView';
import AdminPageHeader from '../components/AdminPageHeader';

/**
 * Render a generic listing view for a model. If you need to customise this for a
 * specific model beyond what is possible with props here consider just copying this file
 * (eg. UserListView) and passing that to ModelCrud:
 *
 *   <ModelCrud model={User} actionComponents={{ list: UserListView }} />
 */
function ListView({
    model,
    renderFilter,
    columns,
    partialRecordFieldNames,
    sortableFields,
    prologue,
    epilogue,
    bulkActions,
    onBulkAction,
    rowSelection,
    initialFilterState,
    headerButtons,
    extraTableProps,
    htmlTitle,
    header,
    baseFilter = {},
}) {
    const { label } = model._meta;
    if (!columns) {
        columns = ['__str__'];
        const detailActions = ['detail', 'update', 'delete'].filter(action =>
            model._meta.isValidObjectAction(action)
        );
        if (detailActions.length > 0) {
            columns.push({
                dataIndex: 'actions',
                render(value, record) {
                    return <ActionLinkList record={record} actions={detailActions} />;
                },
            });
        }
    }
    if (!partialRecordFieldNames) {
        partialRecordFieldNames = getColumnFieldNames(model, columns);
    }
    const { tableProps, filterProps, isInitialLoad } = useListView(model, partialRecordFieldNames, {
        initialState: initialFilterState,
        baseFilter,
    });
    if (!renderFilter && model._meta.crud.filterFields.length) {
        renderFilter = props => <ScbpModelFilterForm model={model} {...props} />;
    }
    const finalTableProps = {
        ...extraTableProps,
        ...tableProps,
    };
    if (extraTableProps && tableProps && extraTableProps.pagination && tableProps.pagination) {
        finalTableProps.pagination = {
            ...tableProps.pagination,
            ...extraTableProps.pagination,
        };
    }
    return (
        <>
            <AdminPageHeader
                htmlTitle={htmlTitle || model.getHtmlTitle()}
                header={header || model.getPageHeader()}
                buttons={
                    headerButtons ||
                    (model._meta.isValidAction('create') && (
                        <ActionLink action="create" model={model} linkComponent={ButtonLink}>
                            {`Create new ${label}`}
                        </ActionLink>
                    ))
                }
            />
            {prologue}
            {renderFilter && renderFilter(filterProps)}
            {isInitialLoad && <Skeleton />}
            {!isInitialLoad && (
                <ScbpListTableView
                    {...finalTableProps}
                    columns={columns}
                    bulkActions={bulkActions}
                    onBulkAction={onBulkAction}
                    rowSelection={rowSelection}
                    sortableFields={sortableFields}
                />
            )}
            {epilogue}
        </>
    );
}

ListView.propTypes = {
    model: modelClass().isRequired,
    /**
     * Function to render filter. If not provided renders a default view if the model
     * has registered filters, otherwise nothing.
     */
    renderFilter: PropTypes.func,
    /**
     * Specify any filters to always apply here (ie. in addition to filters applied by user)
     */
    baseFilter: PropTypes.object,
    /**
     * Columns to render. If not provided renders __str__ and any detail actions on the model.
     */
    columns: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
    /**
     * List of sortable columns. Alternatively can be specified on each column in `columns` on the `sorter` key.
     */
    sortableFields: PropTypes.arrayOf(PropTypes.string),
    prologue: PropTypes.node,
    epilogue: PropTypes.node,
    /**
     * On listing only partial records are fetched. Specify which fields are required here. If not
     * specified extracts fields from `columns`. Note that if you use extra fields in a custom column
     * renderer you will need to specify them here.
     */
    partialRecordFieldNames: PropTypes.arrayOf(PropTypes.string),
    /** A list of bulk actions render for acting upon select rows **/
    bulkActions: bulkActionsProp,
    /** Function to call when one of bulkActions is selected */
    onBulkAction: PropTypes.func,
    /** Required if bulkActions are provided. See https://ant.design/components/table/#rowSelection */
    rowSelection: PropTypes.object,
    /** An object with the initial state for the corresponding filter **/
    initialFilterState: PropTypes.object,
    /** Buttons to render on the page header **/
    headerButtons: PropTypes.node,
    /** Any extra table props to pass through to ScbpListTableView */
    extraTableProps: PropTypes.object,
    /** htmlTitle to pass through to AdminPageHeader. Defaults to model.getHtmlTitle() */
    htmlTitle: PropTypes.string,
    /** header to pass through to AdminPageHeader. Defaults to model.getPageHeader() */
    header: PropTypes.string,
};

export default requirePermissions({ action: 'list', modelProp: 'model' })(ListView);
