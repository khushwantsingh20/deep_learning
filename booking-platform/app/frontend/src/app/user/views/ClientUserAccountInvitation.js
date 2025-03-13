import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import { Button, Col, Row } from 'antd';
import { PropTypes } from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../../common/api';
import LoginForm from '../../../common/auth/components/LoginForm';
import { authSelectors } from '../../../common/auth/reducer';
import FullPageLoading from '../../../common/misc/FullPageLoading';
import SignupForm from '../components/SignupForm';
import { Account, AccountToClient } from '../models';
import styles from './ClientUserAccountInvitation.less';

function acceptInvitation(token) {
    return api.listRoutePost(AccountToClient, 'invitation-link-account', { token });
}

function onSuccess() {
    return (window.location.href = '/');
}

function InvitationActions({ token }) {
    const { run, isLoading } = useAsyncRedux(() => acceptInvitation(token));

    return (
        <div className={styles.invitationActions}>
            <Button
                loading={isLoading}
                size="large"
                type="primary"
                onClick={() => run().then(onSuccess())}
            >
                Accept Invitation
            </Button>
            <ActionLink
                loading={isLoading}
                action="list"
                model={Account}
                linkComponent={ButtonLink}
            >
                Reject Invitation
            </ActionLink>
        </div>
    );
}

InvitationActions.propTypes = {
    token: PropTypes.string.isRequired,
};

function ClientUserAccountInvitationStatus({ token }) {
    const [invitationResponse, setInvitationResponse] = useState('pending');

    useEffect(() => {
        let current = true;
        async function invitationDetails() {
            try {
                await api.listRoutePost(AccountToClient, 'get-invitation-status', {
                    token,
                });
                if (current) {
                    setInvitationResponse('success');
                }
            } catch (apiError) {
                if (current) {
                    const { error } = apiError.response;
                    if (error === 'incorrect account') {
                        setInvitationResponse('incorrect account');
                    } else if (error === 'already linked account') {
                        setInvitationResponse('already linked account');
                    } else {
                        setInvitationResponse('error');
                    }
                }
            }
        }
        invitationDetails();
        return () => {
            current = false;
        };
    }, [token]);

    return (
        <>
            {invitationResponse === 'success' && (
                <>
                    <p>
                        You have been invited to join a billing account, would you like to accept
                        the invitation?
                    </p>
                    <InvitationActions token={token} />
                </>
            )}
            {invitationResponse === 'incorrect account' && (
                <p>
                    This invitation is not for this account, please log out and log in to the
                    correct account.
                </p>
            )}
            {invitationResponse === 'already linked account' && (
                <>
                    <p>This invitation has already been accepted</p>
                    <p>
                        <ActionLink
                            action="list"
                            model={Account}
                            linkComponent={ButtonLink}
                            type="primary"
                        >
                            View your billing accounts
                        </ActionLink>
                    </p>
                </>
            )}
            {invitationResponse === 'error' && <p>Something went wrong, with your invitation.</p>}
        </>
    );
}

ClientUserAccountInvitationStatus.propTypes = {
    token: PropTypes.string.isRequired,
};

function ClientUserLoginRegister({ token }) {
    const [invitationStatus, setInvitationStatus] = useState('pending');

    useEffect(() => {
        let current = true;
        async function invitationDetails() {
            try {
                const checkStatus = await api.listRoutePost(
                    AccountToClient,
                    'get-invitation-details',
                    {
                        token,
                    }
                );
                if (current) {
                    setInvitationStatus(checkStatus);
                }
            } catch (apiError) {
                if (current) {
                    const { error } = apiError.response;

                    if (error) {
                        setInvitationStatus('error');
                    }
                }
            }
        }
        invitationDetails();
        return () => {
            current = false;
        };
    }, [token]);

    if (invitationStatus === 'error') {
        return (
            <>
                <h1>Sorry, something went wrong!</h1>
                <p>
                    Something went wrong with your invitation, please contact the billing account
                    manager to try again.
                </p>
            </>
        );
    }

    if (invitationStatus === 'pending') {
        return <FullPageLoading />;
    }

    let initialValues;

    if (invitationStatus.action === 'register') {
        initialValues = {
            email: invitationStatus.email,
        };

        return <SignupForm initialValues={initialValues} />;
    }

    initialValues = {
        username: invitationStatus.email,
    };

    return (
        <Row>
            <Col span={12} offset={6}>
                <h1>Please Log in</h1>
                <LoginForm initialValues={initialValues} hideSignupLink />
            </Col>
        </Row>
    );
}

ClientUserLoginRegister.propTypes = {
    token: PropTypes.string.isRequired,
};

function ClientUserAccountInvitation({
    match: {
        params: { token },
    },
}) {
    const authState = useSelector(authSelectors.authState);
    const isLoggedIn = authState.isLoggedIn;

    if (!isLoggedIn) {
        return (
            <div className="container">
                <ClientUserLoginRegister token={token} />
            </div>
        );
    }

    return (
        <div className="container">
            <h1>Billing account invitation</h1>
            <ClientUserAccountInvitationStatus token={token} />
        </div>
    );
}

export default ClientUserAccountInvitation;
