import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import CheckPermission from '@alliance-software/djrad/components/permissions/CheckPermission';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { appendToUrl } from '@alliance-software/djrad/util/url';
import { RootEventListener } from 'alliance-react';
import { Button, Icon } from 'antd';
import { List } from 'immutable';
import { PropTypes } from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Link } from 'react-router-dom';
import { ReactComponent as IconProfile } from '../../images/icon-profile.svg';

import { ReactComponent as Logo } from '../../images/limomate-header-logo.svg';
import { setActiveAccount } from '../user/actions';
import { useActiveAccount, useCurrentUser } from '../user/hooks';
import { Account, AccountToClient } from '../user/models';
import styles from './GlobalHeader.less';
import GlobalHeaderMenu from './GlobalHeaderMenu';
import useCreateBookingState from '../booking/hooks/useCreateBookingState';

function CurrentUserMenu({
    activeAccount,
    availableAccountToClients,
    currentUser,
    setMenuIsShown,
}) {
    const { run, isLoading } = useAsyncRedux(setActiveAccount);
    const activeAccountId = activeAccount && activeAccount.getId();
    const [, setBookingState] = useCreateBookingState();

    const activeAccountUrl =
        activeAccountId && Account.getActionUrl('detail', { id: activeAccountId });

    const menu = (
        <div className={styles.accountDropDownMenu} onClick={() => setMenuIsShown(false)}>
            <div className={styles.menuSection}>
                <span className={styles.menuSectionHeading}>Profile:</span>
                <span className={styles.menuSectionName} data-testid="logged-in-user">
                    {currentUser.__str__}
                </span>
                <ul className={styles.menuNav}>
                    <li>
                        <Link to="/my-account/">
                            My Details <Icon type="right" />
                        </Link>
                    </li>
                    <li>
                        <Link to="/my-account/address-book/">
                            My Address Book <Icon type="right" />
                        </Link>
                    </li>
                    <li>
                        <Link to="/my-account/billing-accounts/">
                            My Accounts <Icon type="right" />
                        </Link>
                    </li>
                    {activeAccount && (
                        <>
                            <li>
                                <Link to={appendToUrl(activeAccountUrl, 'bookings')}>
                                    My Bookings <Icon type="right" />
                                </Link>
                            </li>
                            <CheckPermission
                                record={activeAccount}
                                action="userManagement"
                                render={() => (
                                    <li>
                                        <Link to={appendToUrl(activeAccountUrl, 'users')}>
                                            My Users <Icon type="right" />
                                        </Link>
                                    </li>
                                )}
                            />
                            <li>
                                <Link to="/my-account/guest-list/">
                                    My Guest List <Icon type="right" />
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
            <div className={styles.menuSection}>
                <span className={styles.menuSectionHeading}>Billing account in use:</span>
                {activeAccount && (
                    <p>
                        <span
                            className={styles.menuSectionName}
                            data-testid="active-account-nickname"
                        >
                            {activeAccount.accountNickname}
                        </span>
                        <ActionLink record={activeAccount} action="detail">
                            View details <Icon type="right" />
                        </ActionLink>
                    </p>
                )}
                {availableAccountToClients.toArray().length < 1 && (
                    <p>
                        <span
                            className={styles.menuSectionName}
                            data-testid="active-account-nickname"
                        >
                            None set up
                        </span>
                        <ActionLink
                            model={Account}
                            action="create"
                            data-testid="new-billing-account"
                        >
                            + New billing account
                        </ActionLink>
                    </p>
                )}

                {availableAccountToClients.toArray().length > 1 && (
                    <>
                        <span className={styles.menuSectionHeading}>Use another account:</span>
                        <ul className={styles.menuNav}>
                            {availableAccountToClients
                                .filter(aToC => aToC.account !== activeAccountId)
                                .sortBy(aToC => aToC.accountNickname)
                                .map(aToC => (
                                    <li key={aToC.id}>
                                        <Button
                                            data-testid="account-switch-button"
                                            onClick={() => run(aToC.account)}
                                            disabled={isLoading}
                                            type="link"
                                        >
                                            {aToC.accountNickname}
                                        </Button>
                                    </li>
                                ))}
                        </ul>
                    </>
                )}
            </div>
            <div className={styles.menuSection}>
                <ul className={styles.menuNav}>
                    <li>
                        <Link to="/my-account/change-password/">Change Password</Link>
                    </li>
                    <li>
                        <a onClick={() => setBookingState({})} href="/logout/?next=/">
                            Logout
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );

    return menu;
}
function DropDownMenu({
    currentUser,
    activeAccount,
    menuIsShown,
    setMenuIsShown,
    availableAccountToClients,
}) {
    const rootOnClick = useCallback(() => setMenuIsShown(false), [setMenuIsShown]);
    return (
        <RootEventListener onClick={rootOnClick}>
            <div onClick={e => e.stopPropagation()}>
                <button
                    type="button"
                    className={styles.accountDropDown}
                    onClick={() => setMenuIsShown(!menuIsShown)}
                    aria-expanded={menuIsShown ? 'true' : 'false'}
                    aria-controls="menuWrapper"
                    data-testid="account-dropdown"
                >
                    <IconProfile />
                </button>
                <div
                    id="menuWrapper"
                    className={styles.accountDropDownMenuWrap}
                    aria-hidden={menuIsShown ? 'false' : 'true'}
                >
                    {currentUser && (
                        <CurrentUserMenu
                            activeAccount={activeAccount}
                            availableAccountToClients={availableAccountToClients}
                            currentUser={currentUser}
                            setMenuIsShown={setMenuIsShown}
                        />
                    )}
                    {!currentUser && (
                        <div
                            className={styles.accountDropDownMenu}
                            onClick={() => setMenuIsShown(false)}
                        >
                            <div className={styles.menuSection}>
                                <ul className={styles.menuNav}>
                                    <li key="login">
                                        <ButtonLink block type="primary" to="/login/">
                                            Sign in
                                        </ButtonLink>
                                    </li>
                                    <li key="signup">
                                        <ButtonLink block to="/signup/">
                                            Register
                                        </ButtonLink>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </RootEventListener>
    );
}

DropDownMenu.propTypes = {
    currentUser: PropTypes.object,
    menuIsShown: PropTypes.bool,
    setMenuIsShown: PropTypes.func,
    availableAccountToClients: ImmutablePropTypes.listOf(
        modelInstance('scbp_core.accounttoclient')
    ),
    activeAccount: modelInstance('scbp_core.account'),
};

export default function GlobalHeader() {
    const [menuIsShown, setMenuIsShown] = useState(false);
    const currentUser = useCurrentUser();
    const activeAccount = useActiveAccount();
    const { run, records: accountToClientRecords } = useListModel(
        AccountToClient,
        { clientUser: currentUser && currentUser.id },
        {
            partialRecordFieldNames: ['account', 'accountNickname'],
            trigger: useListModel.MANUAL,
        }
    );

    // Only fetch account records once user has logged in
    useEffect(() => {
        if (currentUser) {
            run();
        }
    }, [run, currentUser]);

    return (
        <header className={styles.header}>
            <div className={styles.headerInner}>
                <div className={styles.brand}>
                    <Link to="/" className={styles.logo}>
                        <Logo />
                    </Link>
                </div>
                <GlobalHeaderMenu showLoginLink={!currentUser} />
                <div className={styles.accountMenu}>
                    <DropDownMenu
                        currentUser={currentUser}
                        availableAccountToClients={accountToClientRecords || List()}
                        activeAccount={activeAccount}
                        menuIsShown={menuIsShown}
                        setMenuIsShown={setMenuIsShown}
                    />
                </div>
            </div>
        </header>
    );
}
