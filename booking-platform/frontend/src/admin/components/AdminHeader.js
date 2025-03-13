import { Button, Icon, Layout } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './AdminHeader.less';
import AdminHeaderMenu from './AdminHeaderMenu';

const { Header } = Layout;

export default function AdminHeader(props) {
    const { isMenuCollapsed, onToggleMenu } = props;
    return (
        <Header className={styles.header}>
            <Button
                type="button"
                className={styles.trigger}
                onClick={onToggleMenu}
                aria-expanded={isMenuCollapsed ? 'false' : 'true'}
                aria-controls="sidebar"
            >
                <Icon type={isMenuCollapsed ? 'menu-unfold' : 'menu-fold'} />
                <span className="sr-only">Toggle Menu</span>
            </Button>
            <div className={styles.right}>
                <AdminHeaderMenu />
            </div>
        </Header>
    );
}

AdminHeader.propTypes = {
    onToggleMenu: PropTypes.func.isRequired,
    isMenuCollapsed: PropTypes.bool.isRequired,
};
