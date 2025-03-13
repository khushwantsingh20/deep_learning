import PropTypes from 'prop-types';
import useCheckPermission from '@alliance-software/djrad/hooks/useCheckPermission';
import { Col, Row } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router';

import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import FieldFormatter from '@alliance-software/djrad/components/model/FieldFormatter';
import RelativeModelActionUrlProvider from '@alliance-software/djrad/components/model/RelativeModelActionUrlProvider';
import UrlDrivenTabs from '@alliance-software/djrad/components/UrlDrivenTabs';
import useGetModel from '@alliance-software/djrad/hooks/useGetModel';

import AccountToClientDetailRoutes from './AccountToClientDetailRoutes';
import BookingDetailRoutes from './BookingDetailRoutes';
import ClientAccountUserListView from '../components/ClientAccountUserListView';
import ClientBookingListView from '../components/ClientBookingListView';
import { useAccountNickname, useActiveAccount } from '../hooks';
import { Account, AccountToClient, User, Booking } from '../models';
import ClientBookingUpdateView from '../../booking/views/ClientBookingUpdateView';
import { PaymentMethodType, PaymentTermsType } from '../../../choiceConstants';
import FullPageLoading from '../../../common/misc/FullPageLoading';

import styles from './ClientAccountDetailView.less';

const { TabPane } = UrlDrivenTabs;

function AccountDetailsPane({ accountId }) {
    const { record, isLoading, error } = useGetModel(Account, accountId);
    if (error) {
        throw error;
    }
    if (isLoading) return <FullPageLoading />;

    return (
        <section className={styles.accountDetails}>
            <Row gutter={30}>
                <Col lg={{ span: 8 }}>
                    <div className={styles.accountBlock}>
                        <h3>Account Number</h3>
                        <div>{record.accountNo}</div>
                    </div>

                    <div className={styles.accountBlock}>
                        <h3>Account contact</h3>
                        <div>
                            <div>{`${record.contactTitle} ${record.contactFirstName}
                                ${record.contactLastName}`}</div>
                            <div>{record.accountEmail}</div>
                            <div>{record.contactPhoneMobile}</div>
                            {record.contactPhoneLandline && (
                                <div>{record.contactPhoneLandline}</div>
                            )}
                        </div>
                    </div>
                </Col>
                <Col lg={{ span: 8 }}>
                    <div className={styles.accountBlock}>
                        <h3>Account type:</h3>
                        <div>
                            <FieldFormatter record={record} fieldName="category" />
                        </div>
                    </div>

                    {record.billingAddress && (
                        <div className={styles.accountBlock}>
                            <h3>Billing Address</h3>
                            <div>{record.billingAddress}</div>
                        </div>
                    )}

                    <div className={styles.accountBlock}>
                        <h3>Payment method</h3>
                        <div>
                            <FieldFormatter record={record} fieldName="paymentMethod" />
                        </div>
                    </div>
                </Col>
                <Col lg={{ span: 8 }}>
                    {record.paymentMethod === PaymentMethodType.CREDIT_CARD.value && (
                        <div className={styles.accountBlock}>
                            <h3>Credit card details</h3>
                            <dl>
                                <dt>Card type:</dt>
                                <dd>{record.creditCard.cardType}</dd>
                                <dt>Expiry month / year:</dt>
                                <dd>
                                    {record.creditCardExpiryMonth} / {record.creditCardExpiryYear}
                                </dd>

                                <dt>Last four digits:</dt>
                                <dd>{record.creditCard.toJS().last4}</dd>
                            </dl>
                        </div>
                    )}

                    {record.paymentTerms && (
                        <div className={styles.accountBlock}>
                            <h3>Terms:</h3>
                            <div>
                                {PaymentTermsType.COD.value === record.paymentTerms &&
                                    record.paymentMethod ===
                                        PaymentMethodType.CREDIT_CARD.value && (
                                        <p>Billed to Credit Card - per trip</p>
                                    )}
                                {PaymentTermsType.THIRTY_DAYS.value === record.paymentTerms &&
                                    record.paymentMethod ===
                                        PaymentMethodType.CREDIT_CARD.value && (
                                        <p>
                                            Billed to Credit Card - Monthly (on or around the 7th of
                                            each month)
                                        </p>
                                    )}
                                {PaymentTermsType.THIRTY_DAYS.value === record.paymentTerms &&
                                    record.paymentMethod === PaymentMethodType.INVOICE.value && (
                                        <p>Billed monthly (on or around the 7th of each month)</p>
                                    )}
                            </div>
                        </div>
                    )}
                </Col>
            </Row>
        </section>
    );
}

AccountDetailsPane.propTypes = {
    accountId: PropTypes.number.isRequired,
};

function ClientAccountDetailView({ match }) {
    const activeAccount = useActiveAccount();
    const currentUser = useSelector(User.selectors.currentUser);
    const accountId = Number(match.params.id);
    const accountNickname = useAccountNickname(accountId);
    const [hasDetailPerm, isLoading] = useCheckPermission({
        model: Account,
        id: accountId,
        action: 'detail',
    });
    if (isLoading) return <FullPageLoading />;

    return (
        <div className="container">
            <div className="mainContent">
                <ButtonLink to="/my-account/billing-accounts/" type="link">
                    &lt; Back to accounts
                </ButtonLink>
                <h1>Billing Account - {accountNickname}</h1>
                <UrlDrivenTabs type="card" defaultActiveKey={hasDetailPerm ? 'detail' : 'bookings'}>
                    {hasDetailPerm && (
                        <TabPane tab="Account Details" url="detail">
                            <AccountDetailsPane accountId={accountId} />
                        </TabPane>
                    )}
                    <TabPane
                        tab="Bookings"
                        url="bookings"
                        className={styles.tabpane}
                        renderPane={({ isActive, match: tabMatch }) =>
                            isActive && (
                                <RelativeModelActionUrlProvider
                                    relativeToMatch={tabMatch}
                                    urlBase=""
                                    modelWhitelist={[Booking]}
                                >
                                    <Switch>
                                        <Route exact path={tabMatch.url}>
                                            <ClientBookingListView accountId={accountId} />
                                        </Route>
                                        <Route
                                            path={Booking.getActionPattern('update', tabMatch.url)}
                                            render={routeProps => (
                                                <ClientBookingUpdateView {...routeProps} />
                                            )}
                                        />
                                        <Route
                                            path={Booking.getObjectActionPatternPrefix(
                                                tabMatch.url
                                            )}
                                            component={BookingDetailRoutes}
                                        />
                                    </Switch>
                                </RelativeModelActionUrlProvider>
                            )
                        }
                    />

                    {activeAccount && (
                        <TabPane
                            tab="Users"
                            url="users"
                            className={styles.tabpane}
                            perm={{
                                perm: 'scbp_core.user_management_account',
                                model: Account,
                                id: activeAccount.getId(),
                            }}
                            renderPane={({ isActive, match: tabMatch }) =>
                                isActive && (
                                    <RelativeModelActionUrlProvider
                                        relativeToMatch={tabMatch}
                                        urlBase=""
                                        modelWhitelist={[AccountToClient]}
                                    >
                                        <Switch>
                                            <Route exact path={tabMatch.url}>
                                                <ClientAccountUserListView
                                                    currentUser={currentUser}
                                                    account={accountId}
                                                />
                                            </Route>
                                            <Route
                                                path={AccountToClient.getObjectActionPatternPrefix(
                                                    tabMatch.url
                                                )}
                                                component={AccountToClientDetailRoutes}
                                            />
                                        </Switch>
                                    </RelativeModelActionUrlProvider>
                                )
                            }
                        />
                    )}
                </UrlDrivenTabs>
            </div>
        </div>
    );
}

export default ClientAccountDetailView;
