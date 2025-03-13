import { BodyStyle, injectEventListeners } from 'alliance-react';
import { Alert } from 'antd';
import React, { Suspense, useState } from 'react';
import { hot } from 'react-hot-loader/root';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router';
import AuthenticatedRoute from '../../common/auth/components/AuthenticatedRoute';
import HijackedUserBanner from '../../common/auth/components/HijackedUserBanner';
import ErrorBoundary from '../../common/containers/ErrorBoundary';
import ApiErrorBoundary from '../../common/errors/ApiErrorBoundary';
import useOnLocationChange from '../../common/hooks/useOnLocationChange';
import GlobalFooter from '../../common/layout/GlobalFooter';
import FullPageLoading from '../../common/misc/FullPageLoading';
import SkipLinks from '../../common/misc/SkipLinks';
import CreateBookingView from '../booking/views/CreateBookingView';

import GlobalHeader from '../components/GlobalHeader';
import ClientAccountDetailView from '../user/views/ClientAccountDetailView';
import ClientUserAccountInvitation from '../user/views/ClientUserAccountInvitation';
import LoginView from '../user/views/LoginView';
import PasswordResetRequestView from '../user/views/PasswordResetRequestView';
import PasswordResetView from '../user/views/PasswordResetView';
import UserActivationView from '../user/views/UserActivationView';
import ClientCreateAccountView from '../user/views/ClientAccountCreateView';
import ClientUpdateAccountView from '../user/views/ClientAccountUpdateView';
import UserProfileView from '../user/views/UserProfileView';
import UserSignupView from '../user/views/UserSignupView';
import { Account, User } from '../user/models';
import AirportTransfersView from './AirportTransfersView';
import CovidView from './CovidView';
import DrivingWithSCView from './DrivingWithSCView';
import FaqView from './FaqView';
import HelpView from './HelpView';
import OurStoryView from './OurStoryView';
import PrivacyPolicyView from './PrivacyPolicyView';
import ServicesRoutes from './ServicesRoutes';
import TermsView from './TermsView';
import ContactView from './ContactView';

function scrollToTopOnLocationChange() {
    window.scrollTo(0, 0);
}

/**
 * Base view for authenticated users. Base site routes belong here.
 *
 * When user session expires a modal will be shown. Session expiry is
 * detected by a 401 response from an API call.
 */
function AppView({ location, eventListeners }) {
    const skipLinks = [
        {
            link: '#content',
            text: 'Skip to content',
        },
    ];
    useOnLocationChange(scrollToTopOnLocationChange);
    const currentUser = useSelector(User.selectors.currentUser);
    const [showCustomerNotice, setShowCustomerNotice] = useState(!currentUser);

    return (
        <div {...eventListeners}>
            <ErrorBoundary>
                <HijackedUserBanner />
                <BodyStyle className="app">
                    <div className="wrapper">
                        <SkipLinks links={skipLinks} />
                        <GlobalHeader location={location} />
                        {showCustomerNotice && (
                            <Alert
                                description={
                                    <>
                                        Southern Cross office is open every day, 7am-10pm. Service
                                        available 24 hours, 7 days.
                                        <br />
                                        <strong>
                                        Call Toll free: 1300 12 LIMO(5466)    
                                        </strong>
                                    </>
                                }
                                type="info"
                                closable
                                onClose={() => setShowCustomerNotice(false)}
                                className="existing-customers-banner"
                            />
                        )}
                        <div id="content" className="content" tabIndex="-1">
                            <main id="main" className="main">
                                <Suspense
                                    fallback={
                                        <FullPageLoading>
                                            <h2>Loading...</h2>
                                        </FullPageLoading>
                                    }
                                >
                                    <ApiErrorBoundary>
                                        <Switch>
                                            <Route path="/signup/" component={UserSignupView} />
                                            <Route
                                                path="/activate/:token/"
                                                exact
                                                component={UserActivationView}
                                            />
                                            <Route
                                                path="/request-password-reset/"
                                                component={PasswordResetRequestView}
                                            />
                                            <Route
                                                path="/reset-password/"
                                                exact
                                                component={PasswordResetView}
                                            />
                                            <Route path="/login/" component={LoginView} />
                                            <Route
                                                path="/invitation/:token/"
                                                exact
                                                render={routeProps => (
                                                    <ClientUserAccountInvitation {...routeProps} />
                                                )}
                                            />
                                            <Route
                                                path="/covid-safe/"
                                                exact
                                                component={CovidView}
                                            />
                                            <Route
                                                path="/terms-conditions/"
                                                exact
                                                component={TermsView}
                                            />
                                            <Route
                                                path="/privacy/"
                                                exact
                                                component={PrivacyPolicyView}
                                            />
                                            <Route
                                                path="/chauffeur-services/"
                                                render={routeProps => (
                                                    <ServicesRoutes {...routeProps} />
                                                )}
                                            />
                                            <Route
                                                path="/melbourne-airport-transfers/"
                                                exact
                                                component={AirportTransfersView}
                                            />
                                            <Route path="/faq/" exact component={FaqView} />
                                            <Route
                                                path="/driving-with-southern-cross/"
                                                exact
                                                component={DrivingWithSCView}
                                            />
                                            <Route
                                                path="/our-story/"
                                                exact
                                                component={OurStoryView}
                                            />
                                            <Route path="/contact/" exact component={ContactView} />
                                            <Route path="/help/" exact component={HelpView} />
                                            <AuthenticatedRoute
                                                exact
                                                path={Account.getActionPattern('create')}
                                                render={routeProps => (
                                                    <ClientCreateAccountView {...routeProps} />
                                                )}
                                            />
                                            <AuthenticatedRoute
                                                path={Account.getActionPattern('detail')}
                                                render={routeProps => (
                                                    <ClientAccountDetailView {...routeProps} />
                                                )}
                                            />
                                            <AuthenticatedRoute
                                                path={Account.getActionPattern('update')}
                                                render={routeProps => (
                                                    <ClientUpdateAccountView {...routeProps} />
                                                )}
                                            />
                                            <AuthenticatedRoute
                                                path="/my-account/"
                                                render={routeProps => (
                                                    <UserProfileView {...routeProps} />
                                                )}
                                            />
                                            <Route component={CreateBookingView} />
                                        </Switch>
                                    </ApiErrorBoundary>
                                </Suspense>
                            </main>
                        </div>
                        <GlobalFooter />
                    </div>
                </BodyStyle>
            </ErrorBoundary>
        </div>
    );
}

export default hot(injectEventListeners()(AppView));
