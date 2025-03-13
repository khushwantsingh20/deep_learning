import React from 'react';
import PropTypes from 'prop-types';
import { Button, Popover } from 'antd';
import { formatAuCurrency } from '../../../common/formatters/numeric';
import styles from './PriceSummaryBar.less';

function PriceSummaryLabel({ label, className, priceBreakdown }) {
    const breakdownContent = priceBreakdown && (
        <table>
            <tbody>
                {priceBreakdown.map(component => (
                    <tr key={component[0]}>
                        <td style={{ paddingRight: '24px' }}>{component[0]}</td>
                        <td style={{ textAlign: 'right' }}>{component[1]}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className={styles.labelBox}>
            <div className={className}>{label}</div>
            {priceBreakdown && (
                <div>
                    <Popover
                        content={breakdownContent}
                        overlayClassName={styles.breakdown}
                        placement="bottom"
                        trigger="click"
                    >
                        <Button type="link">Included Costs</Button>
                    </Popover>
                </div>
            )}
        </div>
    );
}

PriceSummaryLabel.propTypes = {
    label: PropTypes.string.isRequired,
    className: PropTypes.string,
    priceBreakdown: PropTypes.arrayOf(
        // 2 element array (description, value)
        PropTypes.array
    ),
};

function PriceSummaryBar({ subTotalLabel, subTotal, total, priceBreakdown, children }) {
    return (
        <div className={styles.summaryBar}>
            {subTotal != null && (
                <div className={styles.subTotal}>
                    {subTotalLabel && (
                        <PriceSummaryLabel label={subTotalLabel} className={styles.subTotalLabel} />
                    )}
                    <span className={styles.subTotalPrice}>{formatAuCurrency(subTotal)}</span>
                </div>
            )}
            {total != null && (
                <div className={styles.total}>
                    <PriceSummaryLabel
                        label="Total:"
                        className={styles.totalLabel}
                        priceBreakdown={priceBreakdown}
                    />
                    <div className={styles.totalPrice}>{formatAuCurrency(total)}</div>
                </div>
            )}
            {children}
        </div>
    );
}

PriceSummaryBar.propTypes = {
    subTotalLabel: PropTypes.string,
    subTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    priceBreakdown: PropTypes.arrayOf(
        // 2 element array (description, value)
        PropTypes.array
    ),
};

export default PriceSummaryBar;
