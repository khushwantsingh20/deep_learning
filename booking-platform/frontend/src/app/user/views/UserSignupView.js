import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import { Col, Row, Icon } from 'antd';
import React from 'react';
import { Helmet } from 'react-helmet';
import { useSelector } from 'react-redux';
import { Switch, Route } from 'react-router-dom';
import { appendToUrl } from '@alliance-software/djrad/util/url';
import AuthenticatedRoute from '../../../common/auth/components/AuthenticatedRoute';
import { User } from '../../../common/user/models';
import { Account } from '../models';
import SignupForm from '../components/SignupForm';
import styles from './LoginView.less';
import { ReactComponent as IconTick } from '../../../images/icon-circle-tick.svg';

function SignupComplete() {
    const currentUser = useSelector(User.selectors.currentUser);
    return (
        <div className={styles.registerPage}>
            <Row>
                <Col lg={{ span: 16, offset: 4 }}>
                    <div className="mainContent">
                        <h1>
                            <IconTick /> Welcome aboard, {currentUser.__str__}
                        </h1>
                        <p>You&apos;ll need a billing account before you can make bookings.</p>
                        <div className={styles.formFooter}>
                            <ButtonLink to="/">I&apos;ll do this later</ButtonLink>
                            <ActionLink
                                linkComponent={ButtonLink}
                                model={Account}
                                action="create"
                                type="primary"
                            >
                                Create a billing account <Icon type="right" />
                            </ActionLink>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
}

function Signup() {
    return (
        <div className={styles.registerPage}>
            <Helmet>
                <title>How to register | Limomate by Southern Cross</title>
                <meta
                    name="description"
                    content="Learn how to register to limomate, and make finding the perfect car for your special occasion a piece of cake."
                />
                <meta
                    name="keywords"
                    content="limomate, limomate app, register, app, car hire service melbourne, car hire app, southern cross vha"
                />
            </Helmet>
            <Row>
                <Col lg={{ span: 16, offset: 4 }}>
                    <div className="mainContent">
                        <h1>Register</h1>
                        <SignupForm onSuccess={() => (window.location.href = 'complete/')} />
                    </div>
                </Col>
            </Row>
        </div>
    );
}

export default function UserSignupView(props) {
    const { match } = props;
    return (
        <Switch>
            <AuthenticatedRoute
                exact
                path={appendToUrl(match.url, 'complete/')}
                component={SignupComplete}
            />
            <Route component={Signup} />
        </Switch>
    );
}
