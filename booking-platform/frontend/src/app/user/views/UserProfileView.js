import { Col, Row } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';

import { modelDetailRoute } from '@alliance-software/djrad/actions';
import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import UrlDrivenTabs from '@alliance-software/djrad/components/UrlDrivenTabs';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';

import ClientAccountListView from './ClientAccountListView';
import ClientAddressView from './ClientAddressView';
import ClientGuestListView from './ClientGuestListView';
import UserChangePasswordView from './UserChangePasswordView';
import styles from './UserProfileView.less';
import UserProfileForm from '../components/UserProfileForm';
import { useActiveAccount } from '../hooks';
import { User, Account } from '../models';
import { defaultOnSuccess } from '../../crud/handlers';
import PageHeader from '../../../common/layout/PageHeader';
import FullPageLoading from '../../../common/misc/FullPageLoading';

const updateSelf = (record, data) => modelDetailRoute('post', record, 'update-self', data);

const { TabPane } = UrlDrivenTabs;

function UserProfileView() {
    const currentUser = useSelector(User.selectors.currentUser);
    const activeAccount = useActiveAccount();
    const { records, isLoading } = useListModel('scbp_core.account');

    const { formProps } = useModelFormProcessor({
        record: currentUser,
        apiAction: updateSelf,
        onSuccess: defaultOnSuccess,
    });

    let accounts = [];

    if (isLoading) {
        return <FullPageLoading />;
    }

    if (!isLoading) {
        accounts = records.toArray();
    }

    return (
        <>
            <div className="container">
                <div className="mainContent">
                    <PageHeader header="My Account" />
                    <UrlDrivenTabs type="card" defaultActiveKey="details">
                        <TabPane tab="Update Profile" url="details" className={styles.tabpane}>
                            <h2 className="h3">Update my profile</h2>
                            <UserProfileForm {...formProps} />
                        </TabPane>
                        <TabPane
                            tab="Change Password"
                            url="change-password"
                            className={styles.tabpane}
                        >
                            <h2 className="h3">Change my password</h2>
                            <UserChangePasswordView />
                        </TabPane>
                        <TabPane tab="Address Book" url="address-book" className={styles.tabpane}>
                            <ClientAddressView user={currentUser.id} account={activeAccount} />
                        </TabPane>
                        <TabPane
                            tab="Billing Accounts"
                            url="billing-accounts"
                            className={styles.tabpane}
                        >
                            <Row>
                                <Col lg={{ span: 18, offset: 3 }}>
                                    <h2 className={`${styles.actionHeading} h3`}>
                                        My billing accounts{' '}
                                        <ActionLink
                                            action="create"
                                            model={Account}
                                            linkComponent={ButtonLink}
                                            type="primary"
                                        >
                                            Create account
                                        </ActionLink>
                                    </h2>
                                    {accounts.length > 0 && (
                                        <ClientAccountListView
                                            accounts={accounts}
                                            activeAccount={activeAccount}
                                        />
                                    )}
                                </Col>
                            </Row>
                        </TabPane>
                        <TabPane tab="Guest List" url="guest-list" className={styles.tabpane}>
                            <Row>
                                <Col lg={{ span: 18, offset: 3 }}>
                                    <ClientGuestListView />
                                </Col>
                            </Row>
                        </TabPane>
                    </UrlDrivenTabs>
                </div>
            </div>
        </>
    );
}

export default UserProfileView;
