import SwitchWidget from '@alliance-software/djrad/components/form/widgets/SwitchWidget';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import { Icon } from 'antd';
import React from 'react';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import ModelLookupWidget from '@alliance-software/djrad/components/form/widgets/ModelLookupWidget';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';

import ScbpModelForm from '../../../common/data/ScbpModelForm';

import { Account } from '../../../common/user/models';
import { AccountToClient } from '../models';
import { ClientUser } from '../../user/models';
import UnlinkAccountFromClient from './UnlinkAccountFromClient';

import styles from './AccountToClientList.less';

export default function AccountToClientForm({ account, clientUser, record }) {
    const formName = record
        ? `account-to-client-${account ? 'account' : 'client'}-${record.getId()}`
        : 'new-account-to-client';
    const formActions = useFormActions(formName);
    const { formProps } = useModelFormProcessor({
        record,
        model: AccountToClient,
        onSuccess: record ? () => {} : formActions.reset,
        formName,
        transformData: data =>
            account ? { ...data, account: account.id } : { ...data, clientUser: clientUser.id },
    });

    return (
        <ScbpModelForm
            footer={null}
            {...formProps}
            onChange={() => {
                if (record) {
                    formActions.submit();
                }
            }}
        >
            <div className={styles.accountRow}>
                <div className={styles.client}>
                    {record ? (
                        account ? (
                            <>
                                {record.clientName} ({record.clientEmail}){' '}
                                <ActionLink
                                    action="update"
                                    model={ClientUser}
                                    params={{ id: record.clientUser }}
                                    target="_blank"
                                >
                                    <Icon type="link" />
                                </ActionLink>
                            </>
                        ) : (
                            <>
                                {record.accountName}{' '}
                                <ActionLink
                                    action="update"
                                    model={Account}
                                    params={{ id: record.account }}
                                    target="_blank"
                                >
                                    <Icon type="link" />
                                </ActionLink>
                            </>
                        )
                    ) : (
                        <ScbpModelForm.Item
                            label={null}
                            name={account ? 'clientUser' : 'account'}
                            widget={
                                <ModelLookupWidget
                                    baseFilter={
                                        account
                                            ? { excludeAccount: account.id }
                                            : { excludeClientUser: clientUser.id }
                                    }
                                    model={account ? ClientUser : Account}
                                    labelFieldName="__str__"
                                    supportsServerSideSearch
                                />
                            }
                        />
                    )}
                </div>
                <div className={styles.permission}>
                    <ScbpModelForm.Item
                        name="isAccountAdmin"
                        label={null}
                        help={null}
                        widget={<SwitchWidget unCheckedChildren="No" checkedChildren="Yes" />}
                    />
                </div>
                <div className={styles.action}>
                    {record ? (
                        <UnlinkAccountFromClient link={record} />
                    ) : (
                        <ScbpModelForm.Button htmlType="submit">
                            Link new {account ? 'client' : 'account'}
                        </ScbpModelForm.Button>
                    )}
                </div>
            </div>
        </ScbpModelForm>
    );
}

AccountToClientForm.propTypes = {
    account: modelInstance('scbp_core.account'),
    clientUser: modelInstance('scbp_core.clientuser'),
    record: modelInstance('scbp_core.accounttoclient'),
};
