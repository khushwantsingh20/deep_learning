import { Tooltip } from 'antd';
import React from 'react';
import PropTypes from 'prop-types';
import BookingPropTypes from '../../app/booking/prop-types';
import { ReactComponent as IconPlane } from '../../images/icon-plane.svg';
import { ReactComponent as IconHome } from '../../images/icon-home.svg';
import { ReactComponent as IconOffice } from '../../images/icon-businessman.svg';
import { ReactComponent as IconSaved } from '../../images/icon-building.svg';
import IconButton from '../ui/IconButton';
import { BookingAddressType, bookingAddressTypeChoices } from '../../choiceConstants';

import styles from './BookingAddressTypeWidget.less';

const iconsByType = {
    [BookingAddressType.AIRPORT.value]: <IconPlane />,
    [BookingAddressType.HOME.value]: <IconHome />,
    [BookingAddressType.OFFICE.value]: <IconOffice />,
    [BookingAddressType.ADDRESS_BOOK.value]: <IconSaved />,
};

/**
 * Show selector for choosing type of address
 */
export default function BookingAddressTypeWidget({
    value,
    onChange,
    canAddAddress,
    missingAddressBookTypes,
    showAddressBook = true,
    showAirport = true,
}) {
    return (
        <div className={`${styles.wrapper} ${canAddAddress ? 'isLoggedIn' : 'notLoggedIn'}`}>
            {bookingAddressTypeChoices
                // Don't show 'custom' button
                .filter(
                    ([v]) =>
                        v !== BookingAddressType.CUSTOM.value &&
                        (showAddressBook || BookingAddressType.ADDRESS_BOOK.value !== v) &&
                        (showAirport || BookingAddressType.AIRPORT.value !== v)
                )
                .map(([v, label]) => {
                    const disabled =
                        (!canAddAddress &&
                            v !== BookingAddressType.AIRPORT.value &&
                            missingAddressBookTypes.includes(v)) ||
                        (v === BookingAddressType.ADDRESS_BOOK.value &&
                            missingAddressBookTypes.includes(v));

                    if (disabled && !canAddAddress) {
                        return (
                            <div className={styles.disabledBtn} key={`to-${v}`}>
                                <Tooltip
                                    placement="top"
                                    title="Please log in to save or choose from personal details"
                                    trigger="hover"
                                >
                                    <span>
                                        <IconButton
                                            label={label}
                                            onSelect={() => onChange(v)}
                                            selected={v === value}
                                            icon={iconsByType[v]}
                                            isInactive={missingAddressBookTypes.includes(v)}
                                            disabled={disabled}
                                            // Remove title when disabled. It's not really required and makes
                                            // tests that use getByTitle more reliable, see issue
                                            // https://github.com/cypress-io/cypress/issues/695
                                            // We were having issue where this button was selected but it was
                                            // removed from DOM as part of re-render and the below IconButton
                                            // was rendered instead.
                                            title={null}
                                        />
                                    </span>
                                </Tooltip>
                            </div>
                        );
                    }

                    return (
                        <IconButton
                            key={`to-${v}`}
                            label={label}
                            onSelect={() => onChange(v)}
                            selected={v === value}
                            icon={iconsByType[v]}
                            isInactive={missingAddressBookTypes.includes(v)}
                            disabled={disabled}
                        />
                    );
                })}
        </div>
    );
}

BookingAddressTypeWidget.propTypes = {
    value: BookingPropTypes.choicesType(BookingAddressType),
    onChange: PropTypes.func.isRequired,
    canAddAddress: PropTypes.bool,
    missingAddressBookTypes: PropTypes.array,
    /**
     * True (the default) if the ADDRESS_BOOK type should be shown.
     */
    showAddressBook: PropTypes.bool,
    /**
     * True (the default) if the AIRPORT type should be shown. For additional stops specifically
     * we don't want to support Airport at this stage.
     */
    showAirport: PropTypes.bool,
};
