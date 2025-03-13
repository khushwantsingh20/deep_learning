import { Button, Icon, Spin } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { handleErrorResponse } from '@alliance-software/djrad/components/form';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';

import PriceBreakdownModal from '../components/PriceBreakdownModal';
import { formatAuCurrency } from '../../../common/formatters/numeric';
import { numeric } from '../../../common/prop-types';
import { BookingPriceBreakdown } from '../../../common/records';

import styles from './BookingPricingSidePanel.less';
import VariationOutOfPocketEntryModal from './VariationOutOfPocketEntryModal';

const basePriceInclusionFields = [
    ['Govt Booking Fee', 'government'],
    ['Airport Parking', 'airportParking'],
    ['Event', 'event'],
];

function VariationAndOOPSection({
    disabled,
    items,
    subTotal,
    isOutOfPocket,
    requestPrice,
    onFieldChange,
}) {
    const [isVisible, setVisible] = useState(false);
    const hideModal = () => setVisible(false);
    const fieldName = isOutOfPocket ? 'outOfPockets' : 'priceVariations';
    return (
        <>
            <PriceRow
                actions={
                    <Button type="link" onClick={() => setVisible(true)} disabled={disabled}>
                        Add new
                    </Button>
                }
                label={`${isOutOfPocket ? 'Out of pocket' : 'Variations'} (${
                    items ? items.length : 0
                })`}
                total={items && subTotal}
            />
            <VariationOutOfPocketEntryModal
                visible={isVisible}
                onCancel={hideModal}
                isOutOfPocket={isOutOfPocket}
                initialValues={{
                    [fieldName]: items,
                }}
                onSubmit={async data => {
                    try {
                        // On submit request price with data which will validate it. On failure
                        // errors are shown - on success we close modal and save the form values
                        await requestPrice(data);
                    } catch (e) {
                        try {
                            handleErrorResponse(e);
                        } catch (submissionError) {
                            // Only worry about the error for the variation / OOP field. It's possible
                            // something in parent form is invalid.. if so we ignore those and only fail
                            // here if the specified field has an error.
                            for (const key in submissionError.errors) {
                                if (key !== fieldName) {
                                    delete submissionError.errors[key];
                                }
                            }
                            if (Object.keys(submissionError.errors).length > 0) {
                                throw submissionError;
                            }
                        }
                    }
                    onFieldChange(fieldName, data[fieldName]);
                    hideModal();
                }}
            />
        </>
    );
}

VariationAndOOPSection.propTypes = {
    disabled: PropTypes.bool,
    items: PropTypes.array,
    subTotal: numeric,
    isOutOfPocket: PropTypes.bool,
    requestPrice: PropTypes.func.isRequired,
    onFieldChange: PropTypes.func.isRequired,
};

export function PriceRow({ actions, label, total }) {
    return (
        <>
            <div className={styles.category}>
                <div className={styles.categoryLabel}>{label}:</div>
                <div className={styles.categoryValue}>
                    {actions}
                    <span>{total != null ? formatAuCurrency(total) : '-'}</span>
                </div>
            </div>
        </>
    );
}

PriceRow.propTypes = {
    /** Any custom actions to render */
    actions: PropTypes.node,
    label: PropTypes.node,
    /** The calculated price for this row - may be null if no price available yet */
    total: numeric,
};

/**
 * Render either the total, if available, or an indicator when loading price
 *
 * When no price is available (eg. insufficient data filled in) render a message
 * indicating as much.
 */
export function PricingTotalIndicator({ total, isLoading, hasValidPrice }) {
    if (isLoading) {
        return <Spin />;
    }
    if (!hasValidPrice) {
        return (
            <span className={styles.warning}>
                <Icon type="warning" /> Insufficient data to calculate price
            </span>
        );
    }
    return <>Total: {formatAuCurrency(total)}</>;
}

PricingTotalIndicator.propTypes = {
    total: numeric,
    isLoading: PropTypes.bool,
    hasValidPrice: PropTypes.bool,
};

export default function BookingPricingSidePanel({
    breakdown,
    requestPrice,
    isLoadingPrice,
    formName,
}) {
    const hasValidPrice = !!breakdown;
    const { total, options, base, fees, rounding } = breakdown || {};
    // Move priceVariations and outOfPockets out of the const - adding
    // them to the record definition causes them to be null if absent
    // which makes the previous default assignment fail
    let {
        priceVariations: priceVariationsBreakdown = {},
        outOfPockets: outOfPocketsBreakdown = {},
    } = breakdown || {};
    if (!priceVariationsBreakdown) {
        priceVariationsBreakdown = {};
    }
    if (!outOfPocketsBreakdown) {
        outOfPocketsBreakdown = {};
    }

    const { priceVariations = [], outOfPockets = [] } = useFormValues(formName, [
        'priceVariations',
        'outOfPockets',
    ]);
    const formActions = useFormActions(formName);
    if (priceVariationsBreakdown && priceVariationsBreakdown.items) {
        priceVariations.forEach((pv, i) => {
            // This is a tuple of label, total
            const item = priceVariationsBreakdown.items[i];
            if (item) {
                pv.total = item[1];
            }
        });
    }
    if (outOfPocketsBreakdown.items) {
        outOfPockets.forEach((oop, i) => {
            // This is a tuple of label, total
            const item = outOfPocketsBreakdown.items[i];
            if (item) {
                oop.total = item[1];
            }
        });
    }
    return (
        <div>
            <h3 className={styles.header}>
                Pricing
                <PriceBreakdownModal breakdown={breakdown} />
                <span className={styles.totalIndicator}>
                    <PricingTotalIndicator
                        total={total}
                        isLoading={isLoadingPrice}
                        hasValidPrice={hasValidPrice}
                    />
                </span>
            </h3>
            <PriceRow
                label="Base Price"
                total={
                    hasValidPrice
                        ? (base ? base.subtotal : 0) + (rounding ? rounding.subtotal : 0)
                        : null
                }
            />
            <hr className={styles.separator} />
            {base &&
                basePriceInclusionFields.map(([label, key]) => (
                    <PriceRow key={key} label={label} total={base[key] || fees[key]} />
                ))}

            <hr className={styles.separator} />
            {options && options.childSeats != null && (
                <PriceRow label="Child Seats" total={options.childSeats} />
            )}
            {options && options.ribbon != null && (
                <PriceRow label="Ribbon" total={options.ribbon} />
            )}
            {options && options.color != null && (
                <PriceRow label="Vehicle Colour Selection" total={options.color} />
            )}
            {options && options.additionalStops != null && (
                <PriceRow label="Additional Stops" total={options.additionalStops} />
            )}
            {options && options.carParkPass != null && (
                <PriceRow label="BHP Pass" total={options.carParkPass} />
            )}
            <hr className={styles.separator} />
            <VariationAndOOPSection
                items={priceVariations}
                requestPrice={requestPrice}
                subTotal={priceVariationsBreakdown.subtotal}
                onFieldChange={formActions.change}
                disabled={!hasValidPrice}
            />
            <hr className={styles.separator} />
            <VariationAndOOPSection
                items={outOfPockets}
                isOutOfPocket
                requestPrice={requestPrice}
                subTotal={outOfPocketsBreakdown.subtotal}
                onFieldChange={formActions.change}
                disabled={!hasValidPrice}
            />
            <div className={styles.totalRow}>
                <span className={styles.totalRowLabel}>Total</span>
                <span className={styles.totalRowValue}>
                    {hasValidPrice ? formatAuCurrency(total) : 'N/A'}
                </span>
            </div>
        </div>
    );
}

BookingPricingSidePanel.propTypes = {
    breakdown: PropTypes.instanceOf(BookingPriceBreakdown),
    requestPrice: PropTypes.func.isRequired,
    isLoadingPrice: PropTypes.bool,
    formName: PropTypes.string.isRequired,
};
