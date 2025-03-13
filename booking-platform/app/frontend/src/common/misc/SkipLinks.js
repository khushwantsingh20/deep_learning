import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import SkipLinkItem from './SkipLinkItem';

import styles from './SkipLinks.less';

const SkipLinks = ({ links, className = '', visible, ...attributes }) => (
    <nav
        className={classNames(styles.skipLinks, { [styles.skipLinksVisible]: visible }, className)}
        aria-label="skip links navigation"
        {...attributes}
    >
        {links.map((link, index) => (
            <SkipLinkItem key={index} {...link} />
        ))}
    </nav>
);

SkipLinks.propTypes = {
    /** Array of objects that contains link and text */
    links: PropTypes.array.isRequired,
    /** Optional class for styling */
    className: PropTypes.string,
    /** Whether visible by default or focusable */
    visible: PropTypes.bool,
};

export default SkipLinks;
