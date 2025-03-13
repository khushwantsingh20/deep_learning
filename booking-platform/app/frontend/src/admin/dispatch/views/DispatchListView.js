import { modelDetailRoute } from '@alliance-software/djrad/actions';
import Form from '@alliance-software/djrad/components/form/Form';
import TextAreaWidget from '@alliance-software/djrad/components/form/widgets/TextAreaWidget';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import { modelClass, modelInstance } from '@alliance-software/djrad/prop-types/model';
import { BodyStyle } from 'alliance-react';
import { Alert, message, Modal, Skeleton } from 'antd';
import Button from 'antd/lib/button/button';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';

import 'react-virtualized/styles.css';

import AdminPageHeader from '../../components/AdminPageHeader';
import DispatchDetailPanel from '../components/DispatchDetailPanel';
import DispatchFilterForm from '../components/DispatchFilterForm';
import DispatchListTable from '../components/DispatchListTable';
import useFieldKeyboardNavigation from '../hooks/useFieldKeyboardNavigation';
import useKeyPress from '../hooks/useKeyPress';
import usePriorState from '../hooks/usePriorState';
import useRefreshTimer from '../hooks/useRefreshTimer';
import useUnverifiedBadge from '../hooks/useUnverifiedBadge';
import { getColumns } from '../misc/dispatchListColumns';
import { DispatchBooking } from '../models';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { getColumnFieldNames } from '../../../common/data/util';
import useListView from '../../../common/hooks/useListView';

import styles from '../dispatch.less';

function declineBookingAction(record) {
    return modelDetailRoute('post', record, 'decline-booking');
}

function completeBookingAction(record) {
    return modelDetailRoute('post', record, 'complete-booking');
}

function cancelBookingAction(record, data) {
    return modelDetailRoute('post', record, 'cancel-booking', data);
}

function ConfirmContent({ onCancel, selectedRecord, refreshDispatchList }) {
    const completeBookingHook = useAsyncRedux(() => completeBookingAction(selectedRecord));
    const completeBooking = () => {
        if (selectedRecord) {
            completeBookingHook.run().then(() => {
                message.success('Booking confirmed');
                onCancel();
                refreshDispatchList();
            });
        }
    };
    return (
        <>
            <p>You are about to complete this job and invoice the client.</p>
            <p>
                It will no longer be possible to modify this booking through the dispatch screen. To
                modify this booking after completion, use the View Booking screen. This page will
                now refresh.
            </p>
            <p>Are you sure?</p>
            <Button autoFocus onClick={() => completeBooking()} type="primary">
                Confirm
            </Button>{' '}
            <Button onClick={() => onCancel()}>Cancel</Button>
        </>
    );
}

ConfirmContent.propTypes = {
    onCancel: PropTypes.func.isRequired,
    selectedRecord: modelInstance('scbp_core.dispatch'),
    refreshDispatchList: PropTypes.func.isRequired,
};

function CancelContent({ onCancel, selectedRecord, refreshDispatchList }) {
    const formName = 'cancellationNotes';
    const formActions = useFormActions(formName);
    const { notes } = useFormValues(formName, ['notes']);
    const cancelBookingHook = useAsyncRedux(data => cancelBookingAction(selectedRecord, data));

    const validate = data => {
        const errors = {};
        if (!data.notes || data.notes.length <= 1) {
            errors.notes = 'You must provide a reason for cancelling this booking';
        }
        return errors;
    };

    const onConfirm = () => {
        formActions.submit();
    };

    const handleSubmit = () => {
        if (selectedRecord && notes) {
            cancelBookingHook.run({ notes }).then(() => {
                message.success('Booking cancelled');
                formActions.reset();
                onCancel();
                refreshDispatchList();
            });
        } else {
            formActions.reset();
            onCancel();
        }
    };

    const handleCancel = () => {
        formActions.reset();
        onCancel();
    };

    return (
        <>
            <p>Are you sure you want to cancel this booking?</p>
            <p>Enter the reason for cancelling this booking below.</p>
            <Form validate={validate} name={formName} onSubmit={data => handleSubmit(data)}>
                <Form.Item label="Cancellation notes">
                    <Form.Field name="notes" widget={TextAreaWidget} />
                </Form.Item>
                <br />
            </Form>
            <Button onClick={() => onConfirm()} type="primary">
                Confirm
            </Button>{' '}
            <Button onClick={() => handleCancel()}>Cancel</Button>
        </>
    );
}

CancelContent.propTypes = {
    onCancel: PropTypes.func.isRequired,
    selectedRecord: modelInstance('scbp_core.dispatch'),
    refreshDispatchList: PropTypes.func.isRequired,
};

function DeclineContent({ onCancel, selectedRecord, refreshDispatchList }) {
    const declineBookingHook = useAsyncRedux(() => declineBookingAction(selectedRecord));
    const declineBooking = () => {
        if (selectedRecord) {
            declineBookingHook.run().then(() => {
                message.success('Booking declined');
                onCancel();
                refreshDispatchList();
            });
        }
    };

    return (
        <>
            <p>Are you sure you want to decline this booking?</p>
            <Button onClick={() => declineBooking()} type="primary">
                Decline
            </Button>{' '}
            <Button>Cancel</Button>
        </>
    );
}

DeclineContent.propTypes = {
    onCancel: PropTypes.func.isRequired,
    selectedRecord: modelInstance('scbp_core.dispatch'),
    refreshDispatchList: PropTypes.func.isRequired,
};

function ShortCutModal({ visible, type, onCancel, selectedRecord, refreshDispatchList }) {
    const renderContent = () => {
        if (type === 'decline') {
            return (
                <DeclineContent
                    onCancel={onCancel}
                    selectedRecord={selectedRecord}
                    refreshDispatchList={refreshDispatchList}
                />
            );
        } else if (type === 'cancel') {
            return (
                <CancelContent
                    onCancel={onCancel}
                    selectedRecord={selectedRecord}
                    refreshDispatchList={refreshDispatchList}
                />
            );
        }

        return (
            <ConfirmContent
                onCancel={onCancel}
                selectedRecord={selectedRecord}
                refreshDispatchList={refreshDispatchList}
            />
        );
    };

    return (
        <Modal
            title={`${type ? type.charAt(0).toUpperCase() + type.slice(1) : ''} Booking`}
            visible={visible}
            footer={null}
            onCancel={onCancel}
            width="40%"
        >
            {type && renderContent()}
        </Modal>
    );
}

ShortCutModal.propTypes = {
    visible: PropTypes.bool,
    type: PropTypes.string,
    onCancel: PropTypes.func.isRequired,
    selectedRecord: modelInstance('scbp_core.dispatch'),
    refreshDispatchList: PropTypes.func.isRequired,
};

function RawDispatchList({ model, sideMenuCollapsed }) {
    /**
     * Initial filter form handling
     */
    const filterFormName = 'DispatchFilterForm';
    const filterFormActions = useFormActions(filterFormName);

    /**
     * Dispatch list refresh timer handlers
     */
    const refreshDispatchList = useCallback(() => {
        filterFormActions.submit();
    }, [filterFormActions]);
    const { forceRefresh, lastRefresh } = useRefreshTimer(refreshDispatchList);

    /**
     * Initial filter properties
     */
    const rawColumns = getColumns({ dryRun: true });
    const partialRecordFieldNames = getColumnFieldNames(model, [
        ...rawColumns,
        'dispatchCategory',
        'additionalStopCount',
        'baggageCount',
        'bookingAdditionalStops',
        'bookingPriority',
        'bookingType',
        'passengerCount',
    ]);
    const { setPriorState, initialSelectedRecordId, initialState } = usePriorState();
    const {
        extraData,
        error,
        filters,
        filterProps,
        isInitialLoad,
        isLoading,
        records,
        tableProps,
    } = useListView(model, partialRecordFieldNames, {
        throwError: false,
        initialState,
        // Don't refetch on every change - this is too frequent (eg. setting run
        // numbers as going down page) and also causes race conditions with
        // optimistic updates (eg. optimistic update applies, triggers refetch
        // while actual update call is happening - whichever one resolves last
        // wins which may have stale data)
        refetchOn: null,
    });

    // We expect to handle only one type of error - that is a 400 response with
    // a list of messages (specifically when you filter by too broad a date range)
    if (error && !(error.status === 400 && error.response && Array.isArray(error.response))) {
        throw error;
    }

    /**
     * Filter form
     */
    const renderFilter = thisFilterProps => {
        if (thisFilterProps.initialValues && thisFilterProps.initialValues.interstate === 'false') {
            thisFilterProps.initialValues.interstate = false;
        }
        return (
            <DispatchFilterForm
                {...thisFilterProps}
                formName={filterFormName}
                refresh={forceRefresh}
                extraData={extraData}
            />
        );
    };

    /**
     *  Row selection from table
     */
    const [selectedRecordId, selectRecordId] = useState(null);
    const [hasFetchedListOnce, setHasFetchedListOnce] = useState(false);
    const onRow = record => selectRecordId(record.id);
    useEffect(() => {
        const recordIds = records ? records.map(record => record.id) : [];
        const resetRecord = () => {
            if (records && records.first()) {
                selectRecordId(records.first().id);
            } else {
                selectRecordId(null);
            }
        };
        if (selectedRecordId) {
            if (!recordIds.includes(selectedRecordId)) {
                resetRecord();
            }
        }
        if (!selectedRecordId && records && records.first()) {
            resetRecord();
        }
    }, [selectedRecordId, records]);
    const selectedRecord =
        records && selectedRecordId ? records.find(r => r.id === selectedRecordId) : null;

    useEffect(() => {
        const recordIds = records ? records.map(record => record.id) : [];
        // isInitialLoad is initially true before the API call completes, and then sets to false.
        // the hasFetchedListOnce check is in place to see if the list has been loaded once so that the current record
        // remains selected for subsequent page loads and the selection does not move back to the top of the page.
        if (!isInitialLoad && !hasFetchedListOnce) {
            setHasFetchedListOnce(true);
            if (initialSelectedRecordId && recordIds.includes(initialSelectedRecordId)) {
                selectRecordId(initialSelectedRecordId);
            }
        }
        setPriorState(isInitialLoad, selectedRecordId, filters);
    }, [
        initialSelectedRecordId,
        selectedRecordId,
        filters,
        setPriorState,
        isInitialLoad,
        records,
        hasFetchedListOnce,
    ]);

    /**
     *  Keyboard shortcuts to enable quick complete, decline and cancel actions.
     */
    const [shortcutModal, setShortcutModal] = useState(null);
    useKeyPress(
        'S',
        useCallback(() => setShortcutModal('confirm'), []),
        !!shortcutModal || !selectedRecordId
    );
    // TODO: Change this to something else in the future. Will be either 'clear' or 'send job to driver'
    // useKeyPress(
    //     'S',
    //     useCallback(() => setShortcutModal('decline'), []),
    //     !!shortcutModal || !selectedRecord
    // );
    useKeyPress(
        'D',
        useCallback(() => setShortcutModal('cancel'), []),
        !!shortcutModal || !selectedRecordId
    );

    const [sendToDriverVisible, setSendToDriverVisible] = useState(false);

    // A list of our editable fields. These are in the order they display in the row.
    const editableRowFields = ['convoyNumber', 'runNumber', 'pencilNote', 'driverNumber'];
    const columnOptions = useCallback(
        useFieldKeyboardNavigation(
            records,
            editableRowFields,
            setSendToDriverVisible,
            selectRecordId
        ),
        [records]
    );

    /**
     * Final column setup
     */
    const columns = getColumns(columnOptions);

    const title = `Dispatch \u2013 ${filterProps.initialValues.travelDate_after &&
        moment(filterProps.initialValues.travelDate_after).format('MMM-DD')}`;

    const unverifiedBadge = useUnverifiedBadge();

    /**
     * Final render
     */
    return (
        <BodyStyle className="dispatch">
            <>
                <AdminPageHeader
                    htmlTitle={title}
                    header={title}
                    buttons={unverifiedBadge}
                    breadcrumbs={false}
                />
                <div className={styles.dispatchWrapper}>
                    <div
                        className={cx(styles.dispatchListColumn, {
                            [styles.menuCollapsed]: sideMenuCollapsed,
                        })}
                    >
                        {renderFilter &&
                            renderFilter({
                                ...filterProps,
                                isLoading,
                            })}
                        {error && <Alert type="error" message={error.response.join(', ')} />}
                        {isInitialLoad && <Skeleton />}
                        {!isInitialLoad && (
                            <div className={styles.dispatchTableWrapper}>
                                <DispatchListTable
                                    {...tableProps}
                                    columns={columns}
                                    onRowClick={onRow}
                                    selectedRow={selectedRecordId}
                                    isLoading={isLoading}
                                />
                                {selectedRecord && (
                                    <ShortCutModal
                                        visible={!!shortcutModal}
                                        type={shortcutModal}
                                        selectedRecord={selectedRecord}
                                        destroyOnClose
                                        onCancel={() => {
                                            setShortcutModal(null);
                                        }}
                                        refreshDispatchList={() => refreshDispatchList()}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                    <div className={styles.dispatchDetailColumn}>
                        {selectedRecordId && (
                            <DispatchDetailPanel
                                lastRefresh={lastRefresh}
                                recordId={selectedRecordId}
                                onComplete={refreshDispatchList}
                                key={selectedRecordId}
                                sendToDriverVisible={sendToDriverVisible}
                                setSendToDriverVisible={setSendToDriverVisible}
                            />
                        )}
                    </div>
                </div>
            </>
        </BodyStyle>
    );
}

RawDispatchList.propTypes = {
    model: modelClass().isRequired,
    sideMenuCollapsed: PropTypes.bool,
};

export default requirePermissions({ action: 'list', model: DispatchBooking })(RawDispatchList);
