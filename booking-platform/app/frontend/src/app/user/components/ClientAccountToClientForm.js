import { updateModel } from '@alliance-software/djrad/actions';
import SwitchWidget from '@alliance-software/djrad/components/form/widgets/SwitchWidget';
import TextAreaWidget from '@alliance-software/djrad/components/form/widgets/TextAreaWidget';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import React from 'react';
import { PropTypes } from 'prop-types';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import api from '../../../common/api';

import ScbpModelForm from '../../../common/data/ScbpModelForm';

import { AccountToClient } from '../models';
import styles from './ClientAccountUserListView.less';
import ClientUnlinkAccount from './ClientUnlinkAccount';

// This returns a function so it's redux action compatible. useModelFormProcessor
// expects apiAction to be a redux action currently.
const inviteAccount = (model, data) => () =>
    api.listRoutePost(AccountToClient, 'invite-account', data);

export default function ClientAccountToClientForm({ clientUser, record, onSuccess, account }) {
    const formName = record ? `account-to-client-${record.getId()}` : 'new-account-to-client';

    const formActions = useFormActions(formName);
    const { formProps } = useModelFormProcessor({
        record,
        model: AccountToClient,
        onSuccess: record ? () => {} : onSuccess,
        formName,
        apiAction: record ? updateModel : inviteAccount,
        transformData: data => (record ? { ...data, clientUser } : { ...data, account }),
    });

    return (
        <ScbpModelForm
            footer={null}
            layout="vertical"
            {...formProps}
            onChange={() => {
                if (record) {
                    formActions.submit();
                }
            }}
        >
            <div className={record ? `${styles.userFauxTableRow}` : `${styles.userInviteRow}`}>
                <div>
                    {record ? (
                        <>
                            <div
                                className={styles.clientName}
                            >{`${record.firstName} ${record.lastName}`}</div>
                            <div className={styles.clientEmail}>{record.email}</div>
                        </>
                    ) : (
                        <>
                            <ScbpModelForm.Item label="Name">
                                <ScbpModelForm.Field name="inviteName" isUserDefinedField />
                            </ScbpModelForm.Item>
                            <ScbpModelForm.Item label="Email address">
                                <ScbpModelForm.Field name="inviteEmail" isUserDefinedField />
                            </ScbpModelForm.Item>
                        </>
                    )}
                </div>
                <div>
                    <ScbpModelForm.Item
                        label={
                            !record
                                ? 'Grant this user Administrator privilege to this account?'
                                : undefined
                        }
                    >
                        <ScbpModelForm.Field
                            name="isAccountAdmin"
                            widget={<SwitchWidget checkedChildren="Yes" unCheckedChildren="No" />}
                        />
                    </ScbpModelForm.Item>
                </div>
                {!record && (
                    <div>
                        <ScbpModelForm.Item label="Include custom message">
                            <ScbpModelForm.Field
                                name="inviteMessage"
                                widget={TextAreaWidget}
                                isUserDefinedField
                            />
                        </ScbpModelForm.Item>
                    </div>
                )}
                <div>
                    {record && (
                        <ActionLink record={record} action="detail">
                            View address book
                        </ActionLink>
                    )}
                </div>
                <div>
                    {record ? (
                        <ClientUnlinkAccount link={record} />
                    ) : (
                        <ScbpModelForm.Button htmlType="submit">Invite</ScbpModelForm.Button>
                    )}
                </div>
            </div>
        </ScbpModelForm>
    );
}

ClientAccountToClientForm.propTypes = {
    clientUser: PropTypes.number,
    record: modelInstance('scbp_core.accounttoclient'),
    onSuccess: PropTypes.func,
    account: PropTypes.number,
};
