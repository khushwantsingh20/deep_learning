import { Avatar, Dropdown, Icon, Menu } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { User } from '../../common/user/models';
import styles from './AdminHeader.less';

export default function AdminHeaderMenu() {
    const currentUser = useSelector(User.selectors.currentUser);

    const menu = (
        <Menu>
            <Menu.Item key="/account/">
                <Link to="/my-account/">
                    <Icon type="user" /> Account Details
                </Link>
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="logout">
                <a href="/logout/?next=/">
                    <Icon type="logout" /> Logout
                </a>
            </Menu.Item>
        </Menu>
    );

    return (
        <Dropdown overlay={menu} trigger={['click']}>
            <div className={styles.accountDropDown}>
                <Avatar icon="user" />
                <span data-testid="logged-in-user" className={styles.name}>
                    {currentUser.__str__}
                </span>
            </div>
        </Dropdown>
    );
}
