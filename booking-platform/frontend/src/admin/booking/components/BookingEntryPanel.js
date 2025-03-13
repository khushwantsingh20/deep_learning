import React from 'react';
import PropTypes from 'prop-types';

import styles from './BookingPanel.less';

export default function BookingPanel({ label, children }) {
    return (
        <div className={styles.panel}>
            <div className={styles.label}>{label}</div>
            <div className={styles.body}>{children}</div>
        </div>
    );
}

BookingPanel.propTypes = {
    label: PropTypes.node.isRequired,
    children: PropTypes.node.isRequired,
};
