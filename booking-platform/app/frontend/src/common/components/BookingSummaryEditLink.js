import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';

import styles from './BookingSummaryEditLink.less';

export default function BookingSummaryEditLink({ onClick }) {
    return (
        <Button type="link" onClick={onClick} className={styles.bookingSummaryEditButton}>
            Edit
        </Button>
    );
}

BookingSummaryEditLink.propTypes = {
    onClick: PropTypes.func.isRequired,
};
