import { Table } from 'antd';
import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { formatAuCurrency } from '../../../common/formatters/numeric';
import styles from './BookingPricingSidePanel.less';

function breakdownToHeaderTableRows(breakdown) {
    let bookingTypeHeader = 'One-Way Booking';
    if (breakdown.fees.interstate) {
        bookingTypeHeader = 'Interstate Booking';
    } else if (breakdown.base.time) {
        bookingTypeHeader = 'Hourly Booking';
    }

    const dataSourceHeader = [
        { label: bookingTypeHeader, value: '', isHeader: true, notCurrency: true },
    ];
    if (breakdown.fees.interstate) {
        // Interstate booking
        return [...dataSourceHeader, { label: 'Interstate Fee', value: breakdown.fees.interstate }];
    }
    return [
        ...dataSourceHeader,
        {
            label: breakdown.base.distance ? 'Total Distance' : 'Total Time',
            value: breakdown.base.time || `${breakdown.base.distance} km`,
            isHeader: true,
            notCurrency: true,
        },
    ];
}

function breakdownToBaseTableRows(breakdown) {
    if (breakdown.fees.interstate) {
        return [];
    }
    const { base, eventName, rounding: roundingBreakdown } = breakdown;
    const rounding = roundingBreakdown ? roundingBreakdown.subtotal : 0;
    let result = [{ label: 'Car Class', value: base.carClass }];
    if (base.peak) {
        result.push({ label: 'Peak Time Fee/Discount', value: base.peak });
    }
    if (base.outOfHours) {
        result.push({ label: 'Out of Hours Fee', value: base.outOfHours });
    }
    if (base.holidayFee) {
        result.push({ label: 'Holiday Fee', value: base.holidayFee });
    }
    if (base.airport) {
        result.push({ label: 'Airport Fee', value: base.airport });
    }
    if (base.adjustment) {
        result = [...result, { label: 'Price Adjustment', value: base.adjustment }];
    }
    result = [
        ...result,
        {
            label: 'Base Price',
            value: base.subtotal + rounding,
            isHeader: true,
        },
    ];
    if (base.eventMinimum) {
        result = [{ label: eventName, value: base.eventMinimum + rounding }, ...result];
    } else if (base.special) {
        return [{ label: 'Price Override', value: base.special + rounding }, ...result];
    } else if (base.distance) {
        result = [
            { label: 'First 5 kilometres', value: base.tier1 + rounding },
            { label: '5 to 40 kilometres', value: base.tier2 },
            { label: 'More than 40 kilometres', value: base.tier3 },
            ...result,
        ];
    } else {
        result = [
            { label: 'First Hour', value: base.firstHour + rounding },
            { label: 'Second Through Sixth Hours', value: base.tier1 },
            { label: 'Over Six Hours', value: base.tier2 },
            ...result,
        ];
    }
    return result;
}

function breakdownToOptionTableRows(breakdown) {
    const { options = {} } = breakdown;
    const result = [];
    if (options.subtotal) {
        if (options.childSeats) {
            result.push({ label: 'Child Seats', value: options.childSeats });
        }
        if (options.ribbon) {
            result.push({ label: 'Wedding Ribbon', value: options.ribbon });
        }
        if (options.color) {
            result.push({ label: 'Vehicle Colour Selection', value: options.color });
        }
        if (options.additionalStops) {
            result.push({ label: 'Additional Stops', value: options.additionalStops });
        }
        if (options.carParkPass) {
            result.push({ label: 'Car Park Pass', value: options.carParkPass });
        }
        result.push({ label: 'Options Total', value: options.subtotal, isHeader: true });
    }
    return result;
}

function breakdownToFeeTableRows(breakdown) {
    if (breakdown.fees.interstate) {
        return [];
    }
    const { fees } = breakdown;
    const result = [];
    if (fees.airportParking) {
        result.push({ label: 'Airport Parking Fee', value: fees.airportParking });
    }
    if (fees.outOfArea) {
        result.push({ label: 'Out of Metro Area Fee', value: fees.outOfArea });
    }
    if (fees.event) {
        result.push({ label: breakdown.eventName || 'Special Event', value: fees.event });
    }
    return [
        ...result,
        { label: 'Government Fees/Taxes', value: fees.government },
        { label: 'Fees/Taxes Total', value: fees.subtotal, isHeader: true },
    ];
}

function breakdownToPriceVariationRows(breakdown, label) {
    if (!breakdown) {
        return [];
    }
    const { items, subtotal } = breakdown;
    return items
        .map(item => ({ label: item.get(0), value: item.get(1) }))
        .concat([{ label: `${label} Total`, value: subtotal, isHeader: true }]);
}

function breakdownToDriverOOPRows(breakdown) {
    if (!breakdown) {
        return [];
    }
    const { fees, outOfPockets } = breakdown;

    let result = 0;
    if (fees.airportParking) {
        result += fees.airportParking;
    }
    if (outOfPockets) {
        result += outOfPockets.subtotal;
    }

    return [
        { label: 'Driver combined Out of Pocket', value: result, className: 'driverCombinedOOP' },
    ];
}

function priceBreakdownToTableRows(breakdown) {
    return [
        ...breakdownToHeaderTableRows(breakdown),
        ...breakdownToBaseTableRows(breakdown),
        ...breakdownToOptionTableRows(breakdown),
        ...breakdownToFeeTableRows(breakdown),
        ...breakdownToPriceVariationRows(breakdown.priceVariations, 'Price Variations'),
        ...breakdownToPriceVariationRows(breakdown.outOfPockets, 'Out of Pocket'),
        { label: 'Total Price', value: breakdown.total, isHeader: true },
        ...breakdownToDriverOOPRows(breakdown),
    ];
}

export default function PriceBreakdownTable({ breakdown }) {
    const columns = [
        { dataIndex: 'label' },
        {
            dataIndex: 'value',
            align: 'right',
            render(value, record) {
                if (record.notCurrency) {
                    return value;
                }
                return formatAuCurrency(value);
            },
        },
    ];
    const dataSource = priceBreakdownToTableRows(breakdown);
    return (
        <Table
            dataSource={dataSource}
            columns={columns}
            rowKey={record => record.label}
            rowClassName={record => {
                let classes = record.isHeader ? styles.breakdownHeader : styles.breakdownNormalRow;
                if (record.className) {
                    classes = cx(classes, styles[record.className]);
                }

                return classes;
            }}
            pagination={false}
            showHeader={false}
            size="small"
        />
    );
}

PriceBreakdownTable.propTypes = {
    breakdown: PropTypes.object.isRequired,
};
