import { Button, Modal } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './BookingPricingSidePanel.less';
import PriceBreakdownTable from './PriceBreakdownTable';

function showPriceBreakdownModal(breakdown) {
    Modal.info({
        title: 'Price Breakdown',
        content: <PriceBreakdownTable breakdown={breakdown} />,
    });
}

export default function PriceBreakdownModal({ breakdown }) {
    if (!breakdown) {
        return <></>;
    }
    return (
        <Button
            className={styles.breakdownButton}
            onClick={() => showPriceBreakdownModal(breakdown)}
            type="link"
        >
            Show Breakdown
        </Button>
    );
}

PriceBreakdownModal.propTypes = {
    breakdown: PropTypes.object,
};
