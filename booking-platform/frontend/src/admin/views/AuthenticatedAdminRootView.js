import cx from 'classnames';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { BodyStyle } from 'alliance-react';
import { Alert, Modal } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { Route, Switch } from 'react-router';
import AccountDetailView from '../account/views/AccountDetailView';
import useUnverifiedBookings from '../booking/hooks/useUnverifiedBookings';
import BookingJobListReport from '../booking/views/BookingJobListReport';
import BookingListView from '../booking/views/BookingListView';
import BookingSalesAnalysisReport from '../booking/views/BookingSalesAnalysisReport';
import LegacyBookingListView from '../booking/views/LegacyBookingListView';
import { Booking } from '../booking/models';
import HijackedUserBanner from '../../common/auth/components/HijackedUserBanner';
import LoginForm from '../../common/auth/components/LoginForm';
import ErrorBoundary from '../../common/containers/ErrorBoundary';
import ModelCrud from '../crud/ModelCrud';
import ApiErrorBoundary from '../../common/errors/ApiErrorBoundary';
import PageNotFound from '../../common/errors/PageNotFound';
import useBreakpoint from '../../common/hooks/useBreakpoint';
import SkipLinks from '../../common/misc/SkipLinks';
import { Account, DriverUser } from '../../common/user/models';
import BookingUnverifiedListView from '../booking/views/BookingUnverifiedListView';
import AdminSideMenu from '../components/AdminSideMenu';
import { DispatchBooking } from '../dispatch/models';
import DispatchListView from '../dispatch/views/DispatchListView';
import { Invoice } from '../invoice/models';
import InvoiceListView from '../invoice/views/InvoiceListView';
import { Payment } from '../payment/models';
import OutstandingPaymentListView from '../payment/views/OutstandingPaymentListView';
import BookingLeadTimeView from '../pricing/views/BookingLeadTimeView';
import {
    DistanceOverrideListView,
    DistanceOverrideRenderForm,
} from '../pricing/views/DistanceOverrideViews';
import PriceListUpdateView from '../pricing/views/PriceListUpdateView';
import { HolidayForm, HolidayListView, HolidayDetailView } from '../pricing/views/HolidayViews';
import HourRateTypeView from '../pricing/views/HourRateTypeView';
import PriceAdjustmentListView from '../pricing/views/PriceAdjustmentListView';
import {
    PriceOverrideListView,
    PriceOverrideRenderForm,
} from '../pricing/views/PriceOverrideViews';
import { SpecialEventForm, SpecialEventListView } from '../pricing/views/SpecialEventViews';
import {
    BookingLeadTime,
    DistanceOverride,
    HolidayModel,
    HourRateType,
    PriceAdjustment,
    PriceList,
    PriceOverride,
    SpecialEvent,
} from '../pricing/models';
import { DriverRevenue, DriverStatement } from '../reports/models';
import DriverRevenueView from '../reports/views/DriverRevenueView';
import DriverStatementView from '../reports/views/DriverStatementView';
import { Statement } from '../statement/models';
import StatementListView from '../statement/views/StatementListView';
import { StaffUser, User, ClientUser } from '../user/models';
import ClientUserDetailView from '../user/views/ClientUserDetailView';
import StaffUserCreateView from '../user/views/StaffUserCreateView';
import StaffUserListView from '../user/views/StaffUserListView';
import StaffUserUpdateView from '../user/views/StaffUserUpdateView';
import ClientUserCreateView from '../user/views/ClientUserCreateView';
import ClientUserListView from '../user/views/ClientUserListView';
import ClientUserUpdateView from '../user/views/ClientUserUpdateView';
import DriverUserCreateView from '../user/views/DriverUserCreateView';
import DriverUserListView from '../user/views/DriverUserListView';
import DriverUserUpdateView from '../user/views/DriverUserUpdateView';
import UserCreateView from '../user/views/UserCreateView';
import UserImpersonateView from '../user/views/UserImpersonateView';
import UserListView from '../user/views/UserListView';
import UserUpdateView from '../user/views/UserUpdateView';
import VehicleColorForm from '../vehicle/components/VehicleColorForm';
import { Vehicle, VehicleClass, VehicleColor, VehicleOperator } from '../vehicle/models';
import VehicleClassListView from '../vehicle/views/VehicleClassListView';
import AdminDashboardView from './AdminDashboardView';
import AdminRedirectFromPublicSiteView from './AdminRedirectFromPublicSiteView';

import VehicleForm from '../vehicle/components/VehicleForm';
import VehicleListView from '../vehicle/views/VehicleListView';
import VehicleOperatorListView from '../vehicle/views/VehicleOperatorListView';
import VehicleOperatorForm from '../vehicle/components/VehicleOperatorForm';
import AccountListView from '../account/views/AccountListView';
import AccountForm from '../account/components/AccountForm';
import BookingCreateUpdateView from '../booking/views/BookingCreateUpdateView';
import BookingIntensityListView from '../booking/views/BookingIntensityListView';

/**
 * List of model routes to register. Creates route for your and passes through all keys in object
 * to the ModelCrud component, eg.
 *   {
 *       model: User,
 *       actionComponents: { list: UserListView },
 *   }
 *
 * is a shortcut to
 *
 *    <Route
 *       path={User.getUrlPrefix()}
 *       render={routeProps => (
 *          <ModelCrud
 *              {...routeProps}
 *              model={User}
 *              actionComponents={{ list: UserListView }}
 *          />
 *      )}
 *    />
 *
 * A basic config with no customisations would be:
 *    {
 *        model: MySimpleModel,
 *    }
 *
 * NOTE: If you want the model to appear in the side menu then update `AdminSideMenu.js` to include it.
 */
const modelRouteConfig = [
    {
        model: User,
        actionComponents: {
            list: UserListView,
            update: UserUpdateView,
            create: UserCreateView,
            impersonate: UserImpersonateView,
        },
    },
    {
        model: StaffUser,
        actionComponents: {
            list: StaffUserListView,
            update: StaffUserUpdateView,
            create: StaffUserCreateView,
            impersonate: UserImpersonateView,
        },
        excludeActions: ['archive', 'unarchive'],
    },
    {
        model: ClientUser,
        actionComponents: {
            list: ClientUserListView,
            update: ClientUserUpdateView,
            detail: ClientUserDetailView,
            create: ClientUserCreateView,
            impersonate: UserImpersonateView,
        },
        excludeActions: ['archive', 'unarchive'],
        inexactActionRoutes: ['update', 'create'],
    },
    {
        model: Account,
        actionComponents: {
            list: AccountListView,
            detail: AccountDetailView,
        },
        renderForm: props => <AccountForm {...props} />,
        excludeActions: ['archive', 'unarchive'],
    },
    {
        model: DistanceOverride,
        actionComponents: { list: DistanceOverrideListView },
        renderForm: props => <DistanceOverrideRenderForm {...props} />,
    },
    {
        model: DriverUser,
        actionComponents: {
            list: DriverUserListView,
            update: DriverUserUpdateView,
            create: DriverUserCreateView,
            impersonate: UserImpersonateView,
        },
        excludeActions: ['archive', 'unarchive'],
    },
    {
        model: VehicleClass,
        actionComponents: {
            list: VehicleClassListView,
        },
        excludeActions: ['moveUp', 'moveDown'],
    },
    {
        model: Vehicle,
        actionComponents: {
            list: VehicleListView,
        },
        renderForm: props => <VehicleForm {...props} />,
        excludeActions: ['archive', 'unarchive'],
    },
    {
        model: VehicleOperator,
        actionComponents: {
            list: VehicleOperatorListView,
        },
        renderForm: props => <VehicleOperatorForm {...props} />,
        excludeActions: ['archive', 'unarchive'],
    },
    {
        model: VehicleColor,
        renderForm: props => <VehicleColorForm {...props} />,
    },
    {
        model: HourRateType,
        actionComponents: { list: HourRateTypeView },
    },
    {
        model: BookingLeadTime,
        actionComponents: { list: BookingLeadTimeView },
    },
    {
        model: HolidayModel,
        actionComponents: { list: HolidayListView, detail: HolidayDetailView },
        renderForm: props => <HolidayForm {...props} />,
    },
    {
        model: SpecialEvent,
        actionComponents: { list: SpecialEventListView },
        renderForm: props => <SpecialEventForm {...props} />,
    },
    {
        model: PriceOverride,
        actionComponents: { list: PriceOverrideListView },
        renderForm: props => <PriceOverrideRenderForm {...props} />,
    },
    {
        model: Booking,
        actionComponents: {
            list: BookingListView,
            listLegacy: LegacyBookingListView,
            listUnverified: BookingUnverifiedListView,
            listIntensity: BookingIntensityListView,
            jobListReport: BookingJobListReport,
            salesAnalysisReport: BookingSalesAnalysisReport,
            create: BookingCreateUpdateView,
            update: BookingCreateUpdateView,
        },
        excludeActions: ['setLegacyReviewStatus'],
    },
    {
        model: DispatchBooking,
        actionComponents: { list: DispatchListView },
    },
    {
        model: Invoice,
        actionComponents: { list: InvoiceListView },
        excludeActions: ['download'],
    },
    {
        model: Statement,
        actionComponents: { list: StatementListView },
        excludeActions: ['download', 'reckonDownload'],
    },
    {
        model: Payment,
        actionComponents: { list: OutstandingPaymentListView },
    },
    {
        model: DriverStatement,
        actionComponents: { list: DriverStatementView },
        excludeActions: ['create', 'update', 'delete', 'sendAll', 'rgiStatement'],
    },
    {
        model: DriverRevenue,
        actionComponents: { list: DriverRevenueView },
        excludeActions: ['create', 'update', 'delete', 'download'],
    },
    {
        model: PriceAdjustment,
        actionComponents: { list: PriceAdjustmentListView },
    },
];

/**
 * Base view for authenticated users
 */
export default function AuthenticatedAdminRootView(props) {
    // This is needed so we can show the total in side menu but only poll in one place
    // We can't do it in the side menu because it won't run when menu collapsed. We
    // can't do it in BookingUnverifiedListView as menu needs to show total so would show
    // 0 until the listing page was visitied... so we do it globally (for admin) here.
    const { notificationElement } = useUnverifiedBookings({ poll: true });
    const { location, sessionExpired, currentUser } = props;
    const { isMobile } = useBreakpoint();
    const [isMenuCollapsed, setMenuCollapsed] = useState(isMobile);
    const toggleMenu = () => setMenuCollapsed(collapsed => !collapsed);
    const pathnameRef = useRef(location.pathname);
    useEffect(() => {
        if (isMobile && props.location.pathname !== pathnameRef.current && !isMenuCollapsed) {
            setMenuCollapsed(true);
        }
        pathnameRef.current = props.location.pathname;
    }, [isMenuCollapsed, isMobile, props.location.pathname]);
    const sideMenu = (
        <AdminSideMenu
            isCollapsed={!isMobile && isMenuCollapsed}
            currentPathname={props.location.pathname}
            theme="dark"
            toggleMenu={toggleMenu}
        />
    );

    const skipLinks = [
        {
            link: '#content',
            text: 'Skip to content',
        },
        {
            link: '#siderNav',
            text: 'Skip to navigation',
        },
    ];

    return (
        <ErrorBoundary>
            <HijackedUserBanner />
            <BodyStyle className={cx('isAuthenticated', 'hasSider')}>
                <div className="wrapper">
                    {notificationElement}
                    <SkipLinks links={skipLinks} />
                    {sideMenu}
                    <div id="content" className="content" tabIndex="-1">
                        <main id="main" className="main">
                            <ApiErrorBoundary>
                                <Switch>
                                    <Route path="/" exact component={AdminDashboardView} />
                                    <Route
                                        path="/redirect-from-app/"
                                        exact
                                        component={AdminRedirectFromPublicSiteView}
                                    />
                                    {modelRouteConfig.map(config => (
                                        <Route
                                            key={config.model._meta.modelId}
                                            path={config.model.getUrlPrefix()}
                                            render={routeProps => (
                                                <ModelCrud
                                                    {...routeProps}
                                                    {...config}
                                                    sideMenuCollapsed={!isMobile && isMenuCollapsed}
                                                />
                                            )}
                                        />
                                    ))}
                                    <Route
                                        path={PriceList.getUrlPrefix()}
                                        component={PriceListUpdateView}
                                    />
                                    <Route component={PageNotFound} />
                                </Switch>
                            </ApiErrorBoundary>
                        </main>
                    </div>
                    {sessionExpired && (
                        <Modal closable={false} footer={null} visible>
                            <Alert
                                style={{ marginBottom: 20 }}
                                type="warning"
                                message="Your session has expired, please login again"
                            />
                            <LoginForm
                                hideSignupLink
                                initialValues={{
                                    username: currentUser.email,
                                }}
                                autoFocusField="password"
                            />
                        </Modal>
                    )}
                </div>
            </BodyStyle>
        </ErrorBoundary>
    );
}

AuthenticatedAdminRootView.propTypes = {
    currentUser: modelInstance('scbp_core.user'),
    sessionExpired: PropTypes.bool,
};
