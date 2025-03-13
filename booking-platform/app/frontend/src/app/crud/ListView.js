import { Skeleton } from 'antd';
import React from 'react';
import PropTypes from 'prop-types';
import { modelClass } from '@alliance-software/djrad/prop-types/model';
import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';

import requirePermissions from '../../common/auth/hoc/requirePermissions';
import ScbpListTableView, { bulkActionsProp } from '../../common/data/ScbpListTableView';
import ScbpModelFilterForm from '../../common/data/ScbpModelForm';
import { getColumnFieldNames } from '../../common/data/util';
import useListView from '../../common/hooks/useListView';
import PageHeader from '../../common/layout/PageHeader';

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
    });
    if (!renderFilter && model._meta.crud.filterFields.length) {
        renderFilter = props => <ScbpModelFilterForm model={model} {...props} />;
    }
    return (
        <>
            <PageHeader
                htmlTitle={model.getHtmlTitle()}
                header={model.getPageHeader()}
                buttons={
                    model._meta.isValidAction('create') && (
                        <ActionLink action="create" model={model} linkComponent={ButtonLink}>
                            {`Create new ${label}`}
                        </ActionLink>
                    )
                }
            />
            {prologue}
            {renderFilter && renderFilter(filterProps)}
            {isInitialLoad && <Skeleton />}
            {!isInitialLoad && (
                <ScbpListTableView
                    {...tableProps}
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
};

export default requirePermissions({ action: 'list', modelProp: 'model' })(ListView);
