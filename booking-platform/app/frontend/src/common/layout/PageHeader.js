import PropTypes from 'prop-types';
import React from 'react';
import Helmet from 'react-helmet';

import styles from './PageHeader.less';

/**
 * Display a header on a page with optional subheading and buttons
 */
function PageHeader({ header, htmlTitle, buttons, className }) {
    return (
        <div className={`${styles.pageHeader} ${className && className}`}>
            {htmlTitle && (
                <Helmet>
                    <title>{htmlTitle}</title>
                </Helmet>
            )}
            <h1 className={styles.mainHeading}>{header}</h1>
            <div className={styles.rightSection}>
                {buttons && <div className={styles.buttons}>{buttons}</div>}
            </div>
        </div>
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
};

export default PageHeader;
