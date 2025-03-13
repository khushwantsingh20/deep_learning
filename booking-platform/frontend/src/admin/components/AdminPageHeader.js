import { Breadcrumb, Breadcrumbs } from '@alliance-software/djrad/components/breadcrumbs';
import PropTypes from 'prop-types';
import React from 'react';
import Helmet from 'react-helmet';
import cx from 'classnames';
import AdminHeaderMenu from './AdminHeaderMenu';

import styles from '../../common/layout/PageHeader.less';

/**
 * Display a header on a page with optional subheading and buttons
 */
function PageHeader({ header, htmlTitle, buttons, className, breadcrumbs = true }) {
    return (
        <>
            <div className={cx(styles.adminPageHeader, className, 'layoutPageHeader')}>
                {htmlTitle && (
                    <Helmet>
                        <title>{htmlTitle}</title>
                    </Helmet>
                )}
                <h1 className={styles.mainHeading}>{header}</h1>
                <div className={styles.rightSection}>
                    {buttons && <div className={styles.buttons}>{buttons}</div>}
                    <AdminHeaderMenu />
                </div>
            </div>
            {breadcrumbs && (
                <nav>
                    <Breadcrumbs className={styles.breadcrumbs}>
                        <Breadcrumb to="/">Home</Breadcrumb>
                    </Breadcrumbs>
                </nav>
            )}
        </>
    );
}

PageHeader.propTypes = {
    /** Title to add to HTML head */
    htmlTitle: PropTypes.string,
    /** Page heading */
    header: PropTypes.node,
    /** Array of components to be displayed to the right */
    buttons: PropTypes.node,
    /** Custom CSS class to use in addition to the default */
    className: PropTypes.string,
    /** Whether to show breadcrumbs or not */
    breadcrumbs: PropTypes.bool,
};

export default PageHeader;
