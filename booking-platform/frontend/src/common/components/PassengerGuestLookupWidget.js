import InputWidget from '@alliance-software/djrad/components/form/widgets/InputWidget';
import useModelClass from '@alliance-software/djrad/hooks/useModelClass';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import cx from 'classnames';
import PropTypes from 'prop-types';
import { createModel, updateModel } from '@alliance-software/djrad/actions';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import { AutoComplete, Button, Icon } from 'antd';
import { List } from 'immutable';
import React, { useEffect, useState } from 'react';
import ScbpModelForm from '../data/ScbpModelForm';
import { ReactComponent as TickIcon } from '../../images/icon-tick.svg';
import { numeric } from '../prop-types';

import styles from './PassengerGuestLookupWidget.less';

function PassengerSaveToGuestListButton({
    showSaveButton,
    record,
    name,
    phoneNumber,
    clientUserId,
}) {
    const GuestTraveller = useModelClass('scbp_core.guesttraveller');
    const { isLoading, run, error } = useAsyncRedux(record ? updateModel : createModel);
    const [savedRecordId, setSavedRecordId] = useState(false);
    const recordId = record && record.id;
    useEffect(() => {
        if (recordId && savedRecordId !== recordId) {
            setSavedRecordId(null);
        }
    }, [recordId, savedRecordId]);
    if (!showSaveButton && savedRecordId) {
        return (
            <div className={styles.success}>
                <TickIcon /> Saved
            </div>
        );
    }
    if (!showSaveButton || !name || !phoneNumber) {
        return null;
    }
    return (
        <>
            {!isLoading && error && (
                <div className={styles.error}>
                    There was a problem saving guest, please try again
                </div>
            )}
            <Button
                disabled={isLoading}
                type="link"
                onClick={() => {
                    setSavedRecordId(false);
                    run(record || GuestTraveller, {
                        name,
                        phoneNumber,
                        clientUser: clientUserId,
                    }).then(response => setSavedRecordId(response.record.id));
                }}
            >
                Save to guest list
            </Button>
        </>
    );
}
PassengerSaveToGuestListButton.propTypes = {
    showSaveButton: PropTypes.bool,
    record: modelInstance('scbp_core.guesttraveller'),
    name: PropTypes.string,
    phoneNumber: PropTypes.string,
    clientUserId: numeric,
};

/**
 * Handle lookups on guests
 *
 * NOTE: If you change this test it on the admin update/create page as well
 * as the public booking page.
 */
export default function PassengerGuestLookupWidget({
    formName,
    clientUserId,
    accountId,
    layout = 'vertical',
}) {
    const { passengerName, passengerPhone } = useFormValues(formName, [
        'passengerName',
        'passengerPhone',
    ]);
    const formActions = useFormActions(formName);
    const { records, isLoading, error } = useListModel(
        'scbp_core.guesttraveller',
        accountId ? { accountId } : { clientUserId }
    );
    if (isLoading && !records) {
        return null;
    }
    let filteredRecords = records;
    if (error) {
        // Worst case for an error is you can't select existing; allow them to still enter new records
        filteredRecords = List();
    }
    filteredRecords = filteredRecords.filter(record =>
        record.name.toLowerCase().includes((passengerName || '').toLowerCase())
    );
    const selectedRecord = (records || []).find(record => record.name === passengerName);
    if (
        selectedRecord &&
        records &&
        filteredRecords.size === 1 &&
        filteredRecords.first() === selectedRecord
    ) {
        // If we have a selected record then show all matches so can quickly change without first deleting all
        // the text in the input
        filteredRecords = records;
    }
    const handleSelect = (key, option) => {
        const { record } = option.props;
        formActions.change('passengerName', record.name);
        formActions.change('passengerPhone', record.phoneNumber);
    };
    // On search clear phone number if set. searching is the same as setting passengerName as it's
    // we are using AutoComplete as the widget for passengerName. The onChange gets passed to handle
    // tracking the change to passengerName automatically.
    const handleSearch = () => {
        if (passengerPhone) {
            formActions.change('passengerPhone', '');
        }
    };
    const showSaveButton =
        !selectedRecord ||
        (selectedRecord.name !== passengerName || selectedRecord.phoneNumber !== passengerPhone);

    const options = filteredRecords
        .filter(r => !!r.name)
        .map(record => (
            <AutoComplete.Option key={record.id} record={record}>
                {record.name}
            </AutoComplete.Option>
        ))
        .toArray();

    const wrapperCol = layout === 'vertical' ? { xs: { span: 24 }, md: { span: 16 } } : null;
    const labelCol = layout === 'vertical' ? { xs: { span: 24 }, md: { span: 8 } } : null;
    return (
        <div className={cx(styles.lookupWidget, styles[layout])}>
            <ScbpModelForm.Item
                name="passengerName"
                label="Name"
                wrapperCol={wrapperCol}
                labelCol={labelCol}
                widget={
                    <AutoComplete
                        defaultOpen={!passengerName}
                        onSearch={handleSearch}
                        onSelect={handleSelect}
                        autoFocus={!passengerName}
                        placeholder="Passenger Name"
                        dataSource={options}
                        data-testid="passenger-name"
                    >
                        <InputWidget
                            suffix={<Icon type="down" className={styles.autoCompleteIcon} />}
                        />
                    </AutoComplete>
                }
            />
            <ScbpModelForm.Item
                wrapperCol={wrapperCol}
                labelCol={labelCol}
                name="passengerPhone"
                label="Phone Number"
                fieldProps={{ placeholder: 'Passenger Phone Number' }}
                help={
                    <PassengerSaveToGuestListButton
                        clientUserId={clientUserId}
                        showSaveButton={showSaveButton}
                        record={selectedRecord}
                        name={passengerName}
                        phoneNumber={passengerPhone}
                    />
                }
            />
        </div>
    );
}

PassengerGuestLookupWidget.propTypes = {
    formName: PropTypes.string.isRequired,
    /**
     * If specified will be passed through to the API when saving a guest
     */
    clientUserId: numeric,
    accountId: numeric,
    layout: PropTypes.oneOf(['vertical', 'horizontal']),
};
