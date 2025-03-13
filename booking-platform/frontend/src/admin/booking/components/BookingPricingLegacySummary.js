import PropTypes from 'prop-types';
import React from 'react';
import { LegacyBookingPriceBreakdown } from '../../../common/records';
import { PriceRow, PricingTotalIndicator } from './BookingPricingSidePanel';
import styles from './BookingPricingSidePanel.less';

export default function BookingPricingLegacySummary({ breakdown }) {
    const {
        carDriver,
        equipment,
        variation,
        variationFee,
        totalTrip,
        creditCardSurcharge,
        total,
        driverJobValue,
        standard,
        discount,
        afterHoursSurcharge,
        bookingFee,
    } = breakdown;
    return (
        <div>
            <h3 className={styles.header}>
                Pricing (Legacy)
                <span className={styles.totalIndicator}>
                    <PricingTotalIndicator total={total} hasValidPrice />
                </span>
            </h3>
            <PriceRow label="Car/Driver" total={carDriver} />
            <PriceRow label="Equipment" total={equipment} />
            <PriceRow label="Variation" total={variationFee} actions={variation} />
            <PriceRow label="Total Trip" total={totalTrip} />
            <PriceRow label="CC fee" total={creditCardSurcharge} />
            <PriceRow label="Total" total={total} />
            <PriceRow label="Driver Job Val" total={driverJobValue} />
            <PriceRow label="Standard" total={standard} />
            <PriceRow label="Discount" total={discount} />
            <PriceRow label="Time surch." total={afterHoursSurcharge} />
            <PriceRow label="Book fee" total={bookingFee} />
        </div>
    );
}
BookingPricingLegacySummary.propTypes = {
    breakdown: PropTypes.instanceOf(LegacyBookingPriceBreakdown),
};
