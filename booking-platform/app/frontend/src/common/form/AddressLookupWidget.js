import { Button, Icon } from 'antd';
import cx from 'classnames';
import PropTypes from 'prop-types';
import InputWidget from '@alliance-software/djrad/components/form/widgets/InputWidget';
import CheckboxWidget from '@alliance-software/djrad/components/form/widgets/CheckboxWidget';
import camelCase from 'lodash/camelCase';
import { Autocomplete } from '@react-google-maps/api';
import React, { useRef } from 'react';

import useGoogleMaps from '../hooks/useGoogleMaps';
import { ReactComponent as IconLocation } from '../../images/icon-location-pin.svg';

import styles from './AddressLookupWidget.less';

export function getAddressComponents(components) {
    return components.reduce((acc, component) => {
        const { long_name: longName, short_name: shortName } = component;
        for (const type of component.types) {
            acc[camelCase(type)] = {
                longName,
                shortName,
            };
        }
        return acc;
    }, {});
}

/**
 * This works on a value that is an object with shape:
 *
 * ```js
 * {
 *     formattedAddress: '234 whitehorse road Nunawading',
 *     lat: -37.832928,
 *     long: 144.95111599999996,
 *     mapUrl: '...',
 *     postalCode: '3131',
 *     countryCode: 'au',
 *     # The google Place ID
 *     sourceId: 'ChIJw60SE_pn1moRZNJ8KhlEo2c',
 * }
 * ```
 *
 * The input box is populated with value.formattedAddress and each key stroke
 * calls onChange with an object with formattedAddress being the only key. Once
 * a selection is made onChange is called with all the other details for the address.
 *
 * If no address is selected value will just contain `formattedAddress`.
 *
 * NOTE: We don't use `useLoadScript` from '@react-google-maps/api' as it doesn't work
 * if you have multiple widgets on same page. We use our own version of useInjectScript.
 *
 *
 * passing onSortChange to this widget will cause sorting arrows to show on side of icons,
 * and onSortChange should be a function that takes an int as parameter: -1 indicates UP
 * arrow had been clicked and 1 indicates DOWN
 */
export default function AddressLookupWidget({
    onChange,
    placeholder,
    value,
    size,
    showIcon,
    showClear,
    onClickIcon = null,
    allowPickupOption = false,
    onSortChange,
    sortIndex,
    sortIndexMax,
    onSaveClick,
    children,
    disabled = false,
    acceptRouteOnly = false,
}) {
    const { isLoaded, error } = useGoogleMaps();
    const searchBox = useRef();
    const v = value || {};
    const { placeName = '', formattedAddress = '', isPickUp, addressLabel = '' } = v;

    const inputValue = v.isValidAddress
        ? [placeName !== 'Melbourne Airport' && placeName, formattedAddress]
              .filter(Boolean)
              .join(', ')
        : formattedAddress;

    const input = (
        <div className={cx(styles.wrapper, { [styles.hasPickup]: allowPickupOption })}>
            {onSortChange && (
                <div className={styles.arrows}>
                    <Button
                        type="link"
                        disabled={sortIndex === 0}
                        className={styles.arrowUp}
                        onClick={() => onSortChange(-1)}
                    >
                        <Icon type="caret-up" />
                    </Button>
                    <Button
                        type="link"
                        disabled={sortIndex === sortIndexMax}
                        className={styles.arrowDown}
                        onClick={() => onSortChange(1)}
                    >
                        <Icon type="caret-down" />
                    </Button>
                </div>
            )}

            {showIcon && (
                <span
                    className={cx(styles.icon, {
                        [styles.iconClickable]: !!onClickIcon,
                    })}
                    onClick={onClickIcon}
                >
                    <IconLocation />
                </span>
            )}

            <InputWidget
                size={size}
                disabled={disabled}
                placeholder={placeholder}
                onChange={({ target }) =>
                    onChange({ ...v, formattedAddress: target.value, isValidAddress: false })
                }
                onBlur={({ target }) => {
                    if (target.value !== inputValue) {
                        onChange({
                            ...v,
                            formattedAddress: target.value,
                            isValidAddress: false,
                        });
                    }
                }}
                addonBefore={addressLabel || 'Address:'}
                value={inputValue}
                onKeyDown={e => {
                    // Pressing enter on the selection without this submits the form
                    // Ideally we would only prevent this if the autocomplete suggestions
                    // box was open but that's hard to get without looking at dom directly
                    if (e.key === 'Enter') {
                        e.preventDefault();
                    }
                }}
            />
            {allowPickupOption && (
                <CheckboxWidget
                    onChange={({ target }) => onChange({ ...v, isPickUp: target.checked })}
                    onBlur={({ target }) => {
                        if (target.checked !== isPickUp) {
                            onChange({
                                ...v,
                                isPickUp: target.checked,
                            });
                        }
                    }}
                    value={isPickUp}
                >
                    Pick-up
                </CheckboxWidget>
            )}
            {(showClear || onSaveClick) && (
                <div className={styles.btnGroup}>
                    {value && showClear && (
                        <Button
                            type="link"
                            onClick={() => {
                                onChange(null);
                            }}
                            className={styles.clear}
                        >
                            Clear
                        </Button>
                    )}
                    {v.isValidAddress && onSaveClick && (
                        <Button type="link" onClick={() => onSaveClick(v)}>
                            Save Location
                        </Button>
                    )}
                </div>
            )}
            {children}
        </div>
    );
    if (!isLoaded || disabled) {
        return input;
    }
    if (error) {
        return <p>There was an unexpected problem. Please refresh the page and try again.</p>;
    }

    return (
        <Autocomplete
            onLoad={ref => (searchBox.current = ref)}
            restrictions={{ country: 'au' }}
            onPlaceChanged={() => {
                const place = searchBox.current.getPlace();
                if (Object.keys(place).length === 1 && 'name' in place) {
                    // No match was made, we are just given the name
                    onChange({ formattedAddress: place.name });
                    return;
                }
                const lat = place.geometry.location.lat();
                const long = place.geometry.location.lng();
                const {
                    utc_offset_minutes: utcOffset,
                    place_id: placeId,
                    formatted_address: nextFormattedAddress,
                    url: mapUrl,
                    types,
                } = place;
                const isStreetAddress = types.includes('street_address');
                const addressComponents = getAddressComponents(place.address_components);
                if (!addressComponents.postalCode || !addressComponents.locality) {
                    onChange({ formattedAddress: place.name, isValidAddress: false });
                    return;
                }

                const limitedFormattedAddress = nextFormattedAddress
                    .split(',')
                    .slice(0, -1)
                    .join(',');

                // 'types' are things like 'street_address', 'route', 'point_of_interest'
                // If we only get 'route' (eg. a street name) then we assume it's a bad address.
                // An example is 3/13 Monomeath Ave, Toorak - Google just returns Monomeath Ave
                // for this rather than the full address. Other places may not have a street number
                // (eg. MCG) but it will be a 'point_of_interest' as well so won't pass this check.
                const isRouteOnly = place.types.length === 1 && place.types[0] === 'route';
                if (isRouteOnly && !acceptRouteOnly) {
                    onChange({ formattedAddress: limitedFormattedAddress, isValidAddress: false });
                    return;
                }
                const changeValue = {
                    placeName: !isStreetAddress ? place.name : '',
                    mapUrl,
                    addressDetails: {
                        addressComponents,
                        utcOffset,
                    },
                    sourceId: placeId,
                    formattedAddress: limitedFormattedAddress,
                    lat,
                    long,
                    postalCode: addressComponents.postalCode.shortName,
                    suburb: addressComponents.locality.longName,
                    isValidAddress: true,
                };
                if (value && value.isPickUp) {
                    changeValue.isPickUp = true;
                }
                onChange(changeValue);
            }}
        >
            {input}
        </Autocomplete>
    );
}

AddressLookupWidget.propTypes = {
    disabled: PropTypes.bool,
    placeholder: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    size: PropTypes.string,
    showIcon: PropTypes.bool,
    showClear: PropTypes.bool,
    onClickIcon: PropTypes.func,
    value: PropTypes.oneOfType([
        PropTypes.shape({
            placeName: PropTypes.string,
            formattedAddress: PropTypes.string.isRequired,
            // These values are set after an address is set. We don't do anything with them in
            // this widget but they are required for the final value that is submitted to the
            // backend
            lat: PropTypes.number,
            long: PropTypes.number,
            countryCode: PropTypes.string,
            suburb: PropTypes.string,
            postalCode: PropTypes.string,
            sourceId: PropTypes.string,
            mapUrl: PropTypes.string,
            addressDetails: PropTypes.object,
        }),
        // This isn't really expected but it's handled; happens when forms are initialised
        // Once value is present it will be of shape above
        PropTypes.string,
    ]),
    allowPickupOption: PropTypes.bool,
    onSortChange: PropTypes.func,
    sortIndex: PropTypes.number,
    sortIndexMax: PropTypes.number,
    onSaveClick: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
    /**
     * If true then addresses that are only a route (eg. just a street w/ no  number) will be accepted.
     * We want to allow this for admins but for general public force them to enter a number or call
     * the office.
     */
    acceptRouteOnly: PropTypes.bool,
};
