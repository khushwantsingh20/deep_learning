import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import PropTypes from 'prop-types';
import React from 'react';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import VehicleClassSelectWidget from '../../../common/form/VehicleClassSelectWidget';
import BookingPropTypes from '../prop-types';
import styles from './CreateBookingController.less';
import InterstateAlert from './InterstateAlert';
import PriceSummaryBar from './PriceSummaryBar';

export default function CreateBookingVehicleClassForm({ bookingContext, headerBar, ...props }) {
    const { vehicleClassPrices, vehicleClasses, isInterstate } = bookingContext;
    const { vehicleClassId = props.initialValues.vehicleClassId } = useFormValues(props.name, [
        'vehicleClassId',
    ]);
    const vehicleClassPrice = vehicleClassPrices[vehicleClassId];
    const selectedVehicleClass =
        vehicleClasses.find(vc => vc.getId() === vehicleClassId) || vehicleClasses.first();

    const priceInclusiveText = (
        <div className="textRight">
            <small>This price is inclusive of tolls, GST and State Government booking fee.</small>
        </div>
    );

    return (
        <div className={styles.optionWrapper}>
            <ScbpModelForm {...props}>
                {headerBar && React.cloneElement(headerBar, { subHeading: priceInclusiveText })}
                {isInterstate && <InterstateAlert />}
                <ScbpModelForm.Item fullWidth>
                    <ScbpModelForm.Field
                        name="vehicleClassId"
                        widget={
                            <VehicleClassSelectWidget
                                vehicleClasses={bookingContext.vehicleClasses}
                                vehicleClassPrices={bookingContext.vehicleClassPrices}
                            />
                        }
                    />
                </ScbpModelForm.Item>
                <PriceSummaryBar
                    subTotal={
                        vehicleClassPrice &&
                        (vehicleClassPrice.breakdown.base
                            ? vehicleClassPrice.breakdown.base.subtotal
                            : 0) +
                            (vehicleClassPrice.breakdown.rounding
                                ? vehicleClassPrice.breakdown.rounding.subtotal
                                : 0) +
                            vehicleClassPrice.breakdown.fees.subtotal
                    }
                    subTotalLabel={`Selected - ${selectedVehicleClass.title}:`}
                    total={vehicleClassPrice && vehicleClassPrice.price}
                >
                    {priceInclusiveText}
                </PriceSummaryBar>
            </ScbpModelForm>
        </div>
    );
}

CreateBookingVehicleClassForm.propTypes = {
    initialValues: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired,
    bookingContext: BookingPropTypes.bookingContext.isRequired,
    headerBar: PropTypes.node,
};
