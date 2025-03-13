import ModelLookupWidget from '@alliance-software/djrad/components/form/widgets/ModelLookupWidget';
import SelectWidget from '@alliance-software/djrad/components/form/widgets/SelectWidget';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import PropTypes from 'prop-types';
import { FORM_ACTIONS } from '@alliance-software/djrad/components/form/FormButton';
import ModelFormButtonBar from '@alliance-software/djrad/components/model/ModelFormButtonBar';
import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import { Button, Col, Modal, Row, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { numeric } from '../../../common/prop-types';
import { Account } from '../../../common/user/models';
import { AccountToClient } from '../../account/models';
import { ClientUser } from '../../user/models';
import AccountForm from '../../account/components/AccountForm';
import ExpiredCreditCardWarning from '../../account/components/ExpiredCreditCardWarning';
import ClientUserForm from '../../user/components/ClientUserForm';
import BookingPanel from './BookingEntryPanel';

import styles from './BookingClientAccountEntryPanel.less';
import { BookingValueRenderer } from './BookingValueWidget';

const { Item } = ScbpModelForm;

/**
 * Renders client user lookup as a grid with name, phone number, suburb
 */
function ClientUserLookupWidget(props) {
    // eslint-disable-next-line react/prop-types
    const { fetching, items, clearSearch, ...rest } = props;
    return (
        <SelectWidget
            labelInValue
            optionLabelProp="label"
            showSearch
            filterOption={false}
            notFoundContent={fetching ? <Spin size="small" /> : <em>No results found</em>}
            onDropdownVisibleChange={open => !open && clearSearch()}
            dropdownMatchSelectWidth={false}
            dropdownRender={menu => (
                <div>
                    <div className={styles.clientUserHeader}>
                        <div className={styles.clientUserName}>Name</div>
                        <div className={styles.clientUserPhone}>Phone</div>
                        <div className={styles.clientUserSuburb}>Home Suburb</div>
                        <div className={styles.clientUserEmail}>Email</div>
                    </div>
                    {menu}
                </div>
            )}
            {...rest}
        >
            {items.map(entity => {
                const [name, phones, suburb, email] = entity.label;
                return (
                    <SelectWidget.Option key={entity.id} value={entity.id} label={name}>
                        <div className={styles.clientUserOption}>
                            <div className={styles.clientUserName}>{name}</div>
                            <div className={styles.clientUserPhone}>
                                {phones.map((p, i) => (
                                    <React.Fragment key={i}>
                                        {p}
                                        <br />
                                    </React.Fragment>
                                ))}
                            </div>
                            <div className={styles.clientUserSuburb}>{suburb}</div>
                            <div className={styles.clientUserEmail}>{email}</div>
                        </div>
                    </SelectWidget.Option>
                );
            })}
        </SelectWidget>
    );
}

function ClientUserCreateModal({ visible, onCancel, onSuccess }) {
    const { formProps } = useModelFormProcessor({
        model: ClientUser,
        onSuccess,
    });

    // Specifically don't render form if not visible... easy way to force form to reset
    // when modal closed (either manually or after successful creation)
    if (!visible) {
        return null;
    }

    return (
        <Modal
            title="Create Client"
            visible={visible}
            onCancel={onCancel}
            footer={null}
            width={1200}
        >
            <ClientUserForm
                forceConnected
                showAccountList={false}
                requirePassword={false}
                footer={
                    <ModelFormButtonBar
                        actions={[FORM_ACTIONS.SAVE]}
                        model={ClientUser}
                        renderLeft={() => <Button onClick={onCancel}>Cancel</Button>}
                    />
                }
                {...formProps}
            />
        </Modal>
    );
}

ClientUserCreateModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
};

function AccountCreateModal({ clientUserId, visible, onCancel, onSuccess, initialValues }) {
    const { formProps } = useModelFormProcessor({
        model: Account,
        onSuccess,
    });

    // We don't want to run this straight away as clientUserId will be undefined as the user has made no selection.
    // When clientUserId changes we can manually call run() in the useEffect() and do the call to get the clientUser
    // record.
    const { record: user, run } = useGetModel('scbp_core.clientuser', clientUserId, {
        trigger: useGetModel.MANUAL,
    });

    useEffect(() => {
        if (clientUserId) {
            run();
        }
    }, [run, clientUserId]);

    // Specifically don't render form if not visible... easy way to force form to reset
    // when modal closed (either manually or after successful creation)
    if (!visible) {
        return null;
    }

    if (!initialValues && user) {
        initialValues = {
            contactTitle: user.title,
            contactFirstName: user.firstName,
            contactLastName: user.lastName,
            accountEmail: user.email,
            contactPhoneMobile: user.contactPhone,
        };
    }

    return (
        <Modal
            title="Create Billing Account"
            visible={visible}
            onCancel={onCancel}
            footer={null}
            width={1200}
        >
            <AccountForm
                forceConnected
                linkClient={clientUserId}
                initialValues={initialValues}
                footer={
                    <ModelFormButtonBar
                        actions={[FORM_ACTIONS.SAVE]}
                        model={ClientUser}
                        renderLeft={() => <Button onClick={onCancel}>Cancel</Button>}
                    />
                }
                {...formProps}
            />
        </Modal>
    );
}

AccountCreateModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    clientUserId: PropTypes.number,
    initialValues: PropTypes.object,
};

export default function BookingClientAccountEntryPanel({
    accountId,
    clientUserId,
    onCreateClientUser,
    onCreateAccount,
    formActions,
}) {
    const { isLoading: isLoadingDefaultAccount, run: getDefaultAccountOrClient } = useListModel(
        AccountToClient,
        {},
        {
            trigger: useGetModel.MANUAL,
            batchCall: true,
            partialRecordFieldNames: ['clientUser', 'isAccountAdmin'],
        }
    );
    const [visibleModal, setVisibleModal] = useState(false);
    const hideModal = () => setVisibleModal(false);
    return (
        <BookingPanel label={<>Client &amp; Account</>}>
            <Row gutter={20}>
                <Col span={6}>
                    <Item
                        name="clientUser"
                        label={
                            <div className={styles.label}>
                                {clientUserId ? (
                                    <ActionLink
                                        model={ClientUser}
                                        params={{ id: clientUserId }}
                                        action="update"
                                        permissionDeniedComponent={() => 'Client'}
                                        target="_blank"
                                    >
                                        Client
                                    </ActionLink>
                                ) : (
                                    'Client'
                                )}
                                <BookingValueRenderer
                                    fieldName="clientUser"
                                    renderWrite={() => (
                                        <Button
                                            onClick={() => setVisibleModal({ type: 'clientUser' })}
                                            type="link"
                                            tabIndex="-1"
                                        >
                                            Add new client
                                        </Button>
                                    )}
                                />
                            </div>
                        }
                        widget={
                            <ModelLookupWidget
                                allowClear
                                model={ClientUser}
                                baseFilter={{
                                    ...(accountId && { account: accountId }),
                                    strict: false,
                                }}
                                labelFieldName="namePhoneSuburbEmail"
                                supportsServerSideSearch
                                lookupWidget={ClientUserLookupWidget}
                                onChange={clientId => {
                                    // When client is selected set the default account if not already chosen
                                    if (!accountId) {
                                        getDefaultAccountOrClient(AccountToClient, {
                                            clientUser: clientId,
                                            isDefaultAccount: true,
                                        }).then(r => {
                                            if (r.entities.size) {
                                                formActions.change(
                                                    'account',
                                                    r.entities.first().account
                                                );
                                            }
                                        });
                                    }

                                    formActions.change('passenger', clientId);
                                }}
                            />
                        }
                    />
                </Col>

                <Col span={8}>
                    <Item
                        name="account"
                        // This resolves issue with only id being shown in label after fetching
                        // default account
                        key={!accountId && isLoadingDefaultAccount ? 'account-loading' : 'account'}
                        label={
                            <div className={styles.label}>
                                {accountId ? (
                                    <ActionLink
                                        model={Account}
                                        params={{ id: accountId }}
                                        action="update"
                                        permissionDeniedComponent={() => 'Account'}
                                        target="_blank"
                                    >
                                        Account
                                    </ActionLink>
                                ) : (
                                    'Account '
                                )}
                                <BookingValueRenderer
                                    fieldName="account"
                                    renderWrite={() => (
                                        <Button
                                            type="link"
                                            disabled={!clientUserId}
                                            title={
                                                !clientUserId
                                                    ? 'Client must be created before account'
                                                    : ''
                                            }
                                            onClick={() => setVisibleModal({ type: 'account' })}
                                            tabIndex="-1"
                                        >
                                            Add new billing account
                                        </Button>
                                    )}
                                />
                            </div>
                        }
                        widget={
                            <ModelLookupWidget
                                model={Account}
                                labelFieldName="__str__"
                                supportsServerSideSearch
                                disabled={isLoadingDefaultAccount}
                                loading={isLoadingDefaultAccount}
                                baseFilter={{ ...(clientUserId && { clientUser: clientUserId }) }}
                                allowClear
                                dropdownMatchSelectWidth={false}
                            />
                        }
                        fieldProps={{
                            onChange: selectedAccountId => {
                                // When client is selected set the default account if not already chosen
                                if (!clientUserId && selectedAccountId) {
                                    getDefaultAccountOrClient(AccountToClient, {
                                        account: selectedAccountId,
                                        isDefaultAccount: true,
                                    }).then(r => {
                                        let accountToClient = r.entities.first();
                                        if (r.entities.size > 0) {
                                            accountToClient = r.entities
                                                .filter(e => e.isAccountAdmin)
                                                .first();
                                        }
                                        if (accountToClient) {
                                            formActions.change(
                                                'clientUser',
                                                accountToClient.clientUser
                                            );
                                            formActions.change(
                                                'passenger',
                                                accountToClient.clientUser
                                            );
                                        }
                                    });
                                }
                                if (selectedAccountId && clientUserId) {
                                    formActions.change('passenger', clientUserId);
                                }
                                if (!selectedAccountId) {
                                    formActions.change('passenger', null);
                                }
                            },
                        }}
                        help={accountId && <ExpiredCreditCardWarning accountId={accountId} />}
                    />
                </Col>

                <Col span={8}>
                    <Item
                        name="supplierConfirmationNumber"
                        label="Supplier Confirmation No."
                        help={null}
                    />
                </Col>
            </Row>
            <ClientUserCreateModal
                visible={visibleModal && visibleModal.type === 'clientUser'}
                onCancel={hideModal}
                onSuccess={({ record }) => {
                    onCreateClientUser(record);
                    setVisibleModal({
                        type: 'account',
                        initialValues: {
                            contactTitle: record.title,
                            contactFirstName: record.firstName,
                            contactLastName: record.lastName,
                            accountEmail: record.email,
                            contactPhoneMobile: record.contactPhone,
                        },
                    });
                }}
            />
            <AccountCreateModal
                clientUserId={parseInt(clientUserId, 10)}
                initialValues={visibleModal ? visibleModal.initialValues : {}}
                visible={visibleModal && visibleModal.type === 'account'}
                onCancel={hideModal}
                onSuccess={({ record }) => {
                    onCreateAccount(record);
                    hideModal();
                }}
            />
        </BookingPanel>
    );
}

BookingClientAccountEntryPanel.propTypes = {
    accountId: numeric,
    clientUserId: numeric,
    onCreateClientUser: PropTypes.func.isRequired,
    onCreateAccount: PropTypes.func.isRequired,
    formActions: PropTypes.object.isRequired,
};
