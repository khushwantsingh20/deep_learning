import useCheckPermissions from '@alliance-software/djrad/hooks/useCheckPermissions';
import { Button, Icon, Layout, Menu } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Account, DriverUser, User } from '../../common/user/models';
import Logo from '../../images/logo-lowres.png';
import { ReactComponent as MenuExpand } from '../../images/menu-expand.svg';
import UnverifiedBookingMenuTitle from '../booking/components/UnverifiedBookingMenuTitle';
import { Booking } from '../booking/models';
import { Invoice } from '../invoice/models';
import { Payment } from '../payment/models';
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
import { Statement } from '../statement/models';
import { StaffUser, ClientUser } from '../user/models';
import { Vehicle, VehicleClass, VehicleColor, VehicleOperator } from '../vehicle/models';

import styles from './AdminSideMenu.less';

const { Sider } = Layout;
const { SubMenu } = Menu;

/**
 * Each menu item has a top level title & icon and then children
 * which form links that make up the sub menu. Each link can optionally
 * have a permission defined on the 'perm' key. If the user has
 * no access to any of the submenu items that menu item won't be
 * shown at all
 */
const menuItems = [
    {
        icon: <Icon type="control" />,
        title: 'Dispatch',
        to: '/dispatch/',
    },
    {
        icon: <Icon type="contacts" />,
        title: 'Bookings',
        key: 'bookingstop',
        children: [
            {
                title: 'Find',
                to: Booking.getActionUrl('list'),
                key: 'bookings',
            },
            {
                title: 'Create New',
                to: Booking.getActionUrl('create'),
                key: 'booking',
            },
            {
                title: <UnverifiedBookingMenuTitle />,
                to: Booking.getActionUrl('listUnverified'),
                key: 'unverified-bookings',
            },
            {
                title: 'Intensity',
                to: Booking.getActionUrl('listIntensity'),
                key: 'bookings-intensity',
            },
            {
                title: 'Job List Report',
                to: Booking.getActionUrl('jobListReport'),
                key: 'job-list-report',
            },
            {
                title: 'Legacy Bookings',
                to: Booking.getActionUrl('listLegacy'),
                key: 'bookings-legacy',
            },
        ],
    },
    {
        icon: <Icon type="user" />,
        title: 'User Management',
        key: 'userManagement',
        children: [
            {
                title: 'All Users',
                perm: User._meta.getActionPermissions('list'),
                to: User.getActionUrl('list'),
            },
            {
                title: 'Staff',
                perm: StaffUser._meta.getActionPermissions('list'),
                to: StaffUser.getActionUrl('list'),
            },
            {
                title: 'Clients',
                perm: ClientUser._meta.getActionPermissions('list'),
                to: ClientUser.getActionUrl('list'),
            },
            {
                title: 'Accounts',
                perm: Account._meta.getActionPermissions('list'),
                to: Account.getActionUrl('list'),
            },
            {
                title: 'Drivers',
                perm: DriverUser._meta.getActionPermissions('list'),
                to: DriverUser.getActionUrl('list'),
            },
        ],
    },
    {
        icon: <Icon type="car" />,
        title: 'Vehicle Management',
        key: 'vehicleManagement',
        children: [
            {
                title: 'Operators',
                perm: VehicleOperator._meta.getActionPermissions('list'),
                to: VehicleOperator.getActionUrl('list'),
            },
            {
                title: 'Vehicles',
                perm: Vehicle._meta.getActionPermissions('list'),
                to: Vehicle.getActionUrl('list'),
            },
            {
                title: 'Colours',
                perm: VehicleColor._meta.getActionPermissions('list'),
                to: VehicleColor.getActionUrl('list'),
            },
            {
                title: 'Classes',
                perm: VehicleClass._meta.getActionPermissions('list'),
                to: VehicleClass.getActionUrl('list'),
            },
        ],
    },
    {
        icon: <Icon type="dollar" />,
        title: 'Administration',
        key: 'pricing',
        children: [
            {
                title: 'Price Settings',
                to: PriceList.getUrlPrefix(),
            },
            {
                title: 'Peak Settings',
                perm: HourRateType._meta.getActionPermissions('list'),
                to: HourRateType.getActionUrl('list'),
            },
            {
                title: 'Lead Time',
                perm: BookingLeadTime._meta.getActionPermissions('list'),
                to: BookingLeadTime.getActionUrl('list'),
            },
            {
                title: 'Holidays',
                perm: HolidayModel._meta.getActionPermissions('list'),
                to: HolidayModel.getActionUrl('list'),
            },
            {
                title: 'Special Events',
                perm: SpecialEvent._meta.getActionPermissions('list'),
                to: SpecialEvent.getActionUrl('list'),
            },
            {
                title: 'Price Overrides',
                perm: PriceOverride._meta.getActionPermissions('list'),
                to: PriceOverride.getActionUrl('list'),
            },
            {
                title: 'Distance Overrides',
                perm: DistanceOverride._meta.getActionPermissions('list'),
                to: DistanceOverride.getActionUrl('list'),
            },
            {
                title: 'Price Adjustments',
                perm: PriceAdjustment._meta.getActionPermissions('list'),
                to: PriceAdjustment.getActionUrl('list'),
            },
        ],
    },
    {
        icon: <Icon type="line-chart" />,
        title: 'Finance',
        key: 'finance',
        children: [
            {
                title: 'Invoices',
                to: Invoice.getActionUrl('list'),
                key: 'invoices',
            },
            {
                title: 'Statements',
                to: Statement.getActionUrl('list'),
                key: 'statements',
            },
            {
                title: 'Outstanding CC',
                to: Payment.getActionUrl('list'),
                key: 'payments',
            },
            {
                title: 'RGIs & Driver Statements',
                to: DriverStatement.getActionUrl('list'),
                key: 'driverStatements',
            },
            {
                title: 'Driver Revenue Report',
                to: DriverRevenue.getActionUrl('list'),
                key: 'driverRevenue',
            },
            {
                title: 'Sales Analysis Report',
                to: Booking.getActionUrl('salesAnalysisReport'),
                key: 'salesAnalysis',
            },
        ],
    },
];
const menuItemPermissions = menuItems.reduce((acc, item) => {
    if (item.perm) {
        acc[item.key] = item.perm;
    }
    if (item.children) {
        item.children.forEach((child, i) => {
            if (child.perm) {
                acc[`${item.key}.${i}`] = child.perm;
            }
        });
    }
    return acc;
}, {});

const sortDescLength = (a, b) => b.length - a.length;

/**
 * Display a side menu for the admin section. Selects active menu based on current route.
 */
export default function AdminSideMenu({ isCollapsed, currentPathname, toggleMenu, ...menuProps }) {
    const selectedItems = menuItems
        .reduce((acc, { key, children, ...rest }) => {
            if (children) {
                acc.push(...children.map(({ to }) => ({ key, to })));
            } else {
                acc.push({ key, ...rest });
            }
            return acc;
        }, [])
        .sort((a, b) => sortDescLength(a.to, b.to))
        .filter(({ to }) => {
            if (to === '/') {
                return currentPathname === '/';
            }
            return currentPathname.startsWith(to);
        })
        .slice(0, 1);
    const [openKeys, setOpenKeys] = useState(() => {
        // Default to first item open
        if (selectedItems.length === 0) {
            return null;
        }
        return selectedItems.map(({ key }) => key);
    });

    const { isLoading, perms } = useCheckPermissions(menuItemPermissions);
    if (isLoading) {
        return null;
    }
    const finalMenuItems = menuItems
        .map(subMenu => {
            if (subMenu.perm && !perms[subMenu.key]) {
                return false;
            }
            const children = (subMenu.children || []).filter(
                (item, i) => !item.perm || perms[`${subMenu.key}.${i}`]
            );
            if (children.length === 0) {
                return subMenu;
            }
            return {
                ...subMenu,
                children,
            };
        })
        .filter(Boolean);

    if (!isCollapsed) {
        // If none selected or explicitly collapsed then default to first available menu item
        menuProps.openKeys =
            openKeys || (finalMenuItems.length > 0 ? [finalMenuItems[0].key] : null);
    }

    const trigger = (
        <Button className={styles.trigger} onClick={toggleMenu}>
            {isCollapsed ? (
                <MenuExpand className={styles.triggerExpand} />
            ) : (
                <MenuExpand className={styles.triggerCollapse} />
            )}
        </Button>
    );

    return (
        <Sider
            trigger={trigger}
            collapsible
            breakpoint="lg"
            width={225}
            className={styles.sider}
            id="sidebar"
            aria-hidden={isCollapsed ? 'true' : 'false'}
        >
            <div className={styles.heading}>
                <Link to="/">
                    <img src={Logo} className={styles.logo} alt="Limomate by Southern Cross" />
                    <span className={styles.brand}>Limomate</span>
                </Link>
            </div>
            <Menu
                mode="inline"
                selectedKeys={selectedItems.map(({ to }) => to)}
                onOpenChange={setOpenKeys}
                id="siderNav"
                tabIndex="-1"
                {...menuProps}
            >
                {finalMenuItems.map(subMenu =>
                    subMenu.children ? (
                        <SubMenu
                            title={
                                <>
                                    {subMenu.icon}{' '}
                                    <span className={styles.title}>{subMenu.title}</span>
                                </>
                            }
                            key={subMenu.key}
                        >
                            {subMenu.children.map(item => (
                                <Menu.Item key={item.to}>
                                    <Link to={item.to}>{item.title}</Link>
                                </Menu.Item>
                            ))}
                        </SubMenu>
                    ) : (
                        <Menu.Item key={subMenu.to}>
                            <Link to={subMenu.to}>
                                {subMenu.icon} <span className={styles.title}>{subMenu.title}</span>
                            </Link>
                        </Menu.Item>
                    )
                )}
            </Menu>
        </Sider>
    );
}

AdminSideMenu.propTypes = {
    /** Current route location pathname */
    currentPathname: PropTypes.string.isRequired,
    /** Whether the side menu is currently collapsed or not */
    isCollapsed: PropTypes.bool.isRequired,
    /** Function to toggle menu collapse */
    toggleMenu: PropTypes.func.isRequired,
};
