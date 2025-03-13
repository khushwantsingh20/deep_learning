import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import PropTypes from 'prop-types';
import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import BookingPropTypes from '../../app/booking/prop-types';

import VehicleClassDetails from '../ui/VehicleClassDetails';

export default function VehicleClassSelectWidget({
    value,
    onChange,
    vehicleClasses,
    vehicleClassPrices,
}) {
    return (
        <>
            {vehicleClasses.map(vehicleClass => {
                let price;
                if (vehicleClassPrices) {
                    const priceRecord = vehicleClassPrices[vehicleClass.getId()];
                    if (!priceRecord) {
                        // eslint-disable-next-line no-console
                        console.error(
                            `Expected price record for ${vehicleClass.getId()} but found none`,
                            vehicleClassPrices
                        );
                    } else {
                        // Vehicle price + fees
                        price =
                            (priceRecord.breakdown.base ? priceRecord.breakdown.base.subtotal : 0) +
                            (priceRecord.breakdown.rounding
                                ? priceRecord.breakdown.rounding.subtotal
                                : 0) +
                            priceRecord.breakdown.fees.subtotal;
                    }
                }

                return (
                    <VehicleClassDetails
                        {...vehicleClass.toJS()}
                        key={vehicleClass.getId()}
                        onSelect={() => onChange(vehicleClass.getId())}
                        selected={value === vehicleClass.getId()}
                        price={price}
                    />
                );
            })}
        </>
    );
}

VehicleClassSelectWidget.propTypes = {
    value: PropTypes.number,
    onChange: PropTypes.func,
    vehicleClasses: ImmutablePropTypes.listOf(modelInstance('scbp_core.vehicleclass')).isRequired,
    vehicleClassPrices: BookingPropTypes.vehicleClassPrices,
};
