import { deleteModel } from '@alliance-software/djrad/actions';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import DetailGridView from '@alliance-software/djrad/components/model/DetailGridView';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import useSite from '@alliance-software/djrad/hooks/useSite';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { Alert, Button, Table, Tabs } from 'antd';
import flattenDeep from 'lodash/flattenDeep';
import groupBy from 'lodash/groupBy';
import startCase from 'lodash/startCase';
import PropTypes from 'prop-types';
import React from 'react';

function getObjectModelLabel(obj, allModels, plural = false) {
    const { modelLabel, modelId } = obj;
    const model = allModels.get(modelId);
    // If model is registered let it dictate label to use
    if (model) {
        return startCase(plural ? model._meta.labelPlural : model._meta.label);
    }
    return startCase(modelLabel);
}

/**
 * Render tabbed view for objects returned by deletion summary. Delete summary endpoint
 * returns objects that have a shape like:
 * {
 *     modelId: 'myapp.mymodel',
 *     pk: 5,
 *     label: 'My Object',
 *     modelLabel: 'My Model',
 * }
 *
 * The objects parameter itself can contain nested arrays but the terminal condition is
 * always an object with the above shape. This is what django generates when aggregating
 * the list of records that will be deleted or block a deletion.
 *
 * This view just groups the objects by modelId then renders each one as a paginated table
 * in a tab.
 *
 * @param props
 * @param props.objects List of objects in shape returned by the delete_summary endpoint
 * @param props.allModels All registered djrad models in system. This is used to determine
 * if we can link to a model or not.
 */
function TabbedObjectView({ objects, allModels }) {
    const byModelId = groupBy(flattenDeep(objects), 'modelId');
    return (
        <Tabs>
            {Object.entries(byModelId).map(([modelId, items]) => (
                <Tabs.TabPane
                    tab={`${getObjectModelLabel(items[0], allModels, true)} (${
                        items.length
                    } records)`}
                    key={modelId}
                >
                    <Table
                        dataSource={items}
                        rowKey={row => row.pk}
                        columns={[
                            {
                                title: getObjectModelLabel(items[0], allModels),
                                dataIndex: 'title',
                                render(value, item) {
                                    const { label, pk } = item;
                                    const model = allModels.get(modelId);
                                    if (model && model._meta.isValidAction('detail')) {
                                        return (
                                            <ActionLink
                                                model={model}
                                                params={{ id: pk }}
                                                action="detail"
                                                permissionDeniedComponent={() => label}
                                            >
                                                {label}
                                            </ActionLink>
                                        );
                                    }
                                    return label;
                                },
                            },
                        ]}
                    />
                </Tabs.TabPane>
            ))}
        </Tabs>
    );
}

TabbedObjectView.propTypes = {
    /**
     * List of objects from the delete_summary endpoint
     */
    objects: PropTypes.arrayOf(PropTypes.object).isRequired,
    /**
     * All the djrad models as provided by djradSite.models
     */
    allModels: PropTypes.object.isRequired,
};

/**
 * Render the summary for a record deletion.
 *
 * If the object can't be deleted due to foreign key restrictions it shows
 * the records that block it.
 *
 * If it can be deleted shows a summary of the record and all the related records
 * that will be cascaded as a result.
 */
export default function DeleteSummary(props) {
    const { record, summary, onSuccess } = props;
    const { toDelete } = summary;

    const djradSite = useSite();
    const { error, isLoading: isDeleting, run } = useAsyncRedux(
        () => deleteModel(record, record.getId()),
        { onSuccess }
    );
    const handleDelete = () => run().then(onSuccess);

    if (summary.protected.length > 0) {
        return (
            <>
                <Alert
                    message="Delete Blocked"
                    description={
                        <>
                            <p>
                                The specified record cannot be deleted as some related records
                                depend on it and cannot be automatically removed. Below is list of
                                all records blocking this change.
                            </p>
                        </>
                    }
                    type="warning"
                    showIcon
                />
                <TabbedObjectView objects={summary.protected} allModels={djradSite.models} />
            </>
        );
    }
    const hasRelatedRecords = toDelete[1] && toDelete[1].length > 0;
    return (
        <>
            <h3>The following record will be removed:</h3>
            <DetailGridView record={record} footer={null} />
            {hasRelatedRecords && (
                <>
                    <h3>All these related records will be removed:</h3>
                    <TabbedObjectView objects={toDelete[1]} allModels={djradSite.models} />
                </>
            )}
            <Alert
                message="CONFIRM PERMANENT DELETION"
                description={
                    <>
                        <p>
                            The specified record{' '}
                            {hasRelatedRecords ? 'and related records will all' : 'will'} be
                            permanently removed. Are you sure? This cannot be undone.
                        </p>
                        <Button disabled={isDeleting} onClick={handleDelete} type="danger">
                            Yes, Delete All Records
                        </Button>
                    </>
                }
                type="warning"
                showIcon
            />
            {error && (
                <Alert
                    style={{ marginTop: 10 }}
                    message="There was a problem deleting this record. Please try again."
                    type="error"
                />
            )}
        </>
    );
}

DeleteSummary.propTypes = {
    record: modelInstance().isRequired,
    summary: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
};
