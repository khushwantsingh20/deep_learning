import PropTypes from 'prop-types';
import React from 'react';

import FieldFormatter from '@alliance-software/djrad/components/model/FieldFormatter';
import ModelFormFieldWidget from '@alliance-software/djrad/components/model/ModelFormFieldWidget';
import componentPropType from '@alliance-software/djrad/prop-types/component';

import { BookingStatus } from '../../../choiceConstants';
import { useAdminBooking } from '../adminBookingContext';

import styles from './BookingValueWidget.less';

const writeableStatuses = [
    BookingStatus.UNVERIFIED,
    BookingStatus.VERIFIED,
    BookingStatus.CHANGED,
    BookingStatus.CLEARED,
].map(s => s.value);

const alwaysWriteableFields = [
    // bookingPaymentMethod should be editable for completed bookings - this
    // allows the user to indicate that the driver was not in fact paid
    'bookingPaymentMethod',
    'driverCollectMethod',
    'vehicle',
];

/**
 * Render a field as either writeable or read only
 *
 * Some fields are not writeable based on the status of the booking - this is controlled here.
 *
 * @param fieldName Name of the field to determine whether field is writeable or not
 * @param renderWrite Function to call to render value when writeable
 * @param renderView Function to call to render value when not writeable
 */
export function BookingValueRenderer({ fieldName, renderWrite, renderView }) {
    const { booking, missingPriceFields } = useAdminBooking();
    if (
        booking &&
        // Legacy managed bookings are never editable
        (booking.isManagedInLegacy ||
            (!alwaysWriteableFields.includes(fieldName) &&
                (!writeableStatuses.includes(booking.bookingStatus) ||
                    ['clientUser', 'account'].includes(fieldName))))
    ) {
        if (!renderView) {
            return null;
        }
        return renderView(booking);
    }
    const el = renderWrite();
    // If field name is eg. bookingAdditionalStops[0] instead look it up as bookingAdditionalStops
    const priceFieldName = fieldName.split('[0]')[0];
    let className = '';
    if (missingPriceFields.includes(priceFieldName)) {
        className = styles.priceWarning;
        // When a price field is missing we want to indicate that to the user so they know which
        // fields to fill in to get a price estimate
        // Note we don't conditionally render el here - we always render it below. This is so that
        // the component tree stays the same and doesn't lose it's identity and get remounted.
    }
    return <div className={className}>{el}</div>;
}

BookingValueRenderer.propTypes = {
    fieldName: PropTypes.string.isRequired,
    renderWrite: PropTypes.func.isRequired,
    renderView: PropTypes.func,
};

/**
 * Render a field as a widget if it's editable otherwise as it's formatter when not
 */
export default function BookingValueWidget({ widget, formatterComponent, ...props }) {
    const fieldName = props.name || props.djradFieldName;
    const renderView = booking => {
        if (formatterComponent) {
            return React.createElement(formatterComponent, props);
        }
        return <FieldFormatter fieldName={fieldName} value={props.value} record={booking} />;
    };
    const renderWrite = () => {
        if (widget) {
            if (React.isValidElement(widget)) {
                return React.cloneElement(widget, props);
            }
            return React.createElement(widget, props);
        }
        return <ModelFormFieldWidget name={fieldName} {...props} />;
    };

    return (
        <BookingValueRenderer
            fieldName={fieldName}
            renderView={renderView}
            renderWrite={renderWrite}
        />
    );
}

BookingValueWidget.propTypes = {
    /** Optional widget component or element to use. If not specified uses default for field */
    widget: PropTypes.oneOfType([componentPropType, PropTypes.node]),
    /** Optional component to use when field is read only. If not specified uses default for field */
    formatterComponent: componentPropType,
    value: PropTypes.any,
    /** Name of the field. Either this or djradFieldName may be specified. This is passed from djrad. */
    name: PropTypes.string,
    djradFieldName: PropTypes.string,
};
