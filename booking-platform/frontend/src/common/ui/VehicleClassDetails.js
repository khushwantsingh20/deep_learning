import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { ReactComponent as PassengerIcon } from '../../images/icon-people.svg';
import { ReactComponent as LuggageIcon } from '../../images/icon-suitcase.svg';
import { formatAuCurrency } from '../formatters/numeric';
import IconButton from './IconButton';
import BookingSummaryEditLink from '../../common/components/BookingSummaryEditLink';

import styles from './VehicleClassDetails.less';

const ConditionalWrap = ({ condition, wrapper, children }) =>
    condition ? wrapper(children) : children;

function VehicleClassDetails({
    price,
    title,
    image,
    maxPassengerCount,
    maxBaggageCount,
    description,
    isSummary = false,
    onSelect,
    selected,
    onEditClick,
}) {
    return (
        <div
            className={cx(
                styles.vehicleClass,
                { [styles.isSummary]: isSummary },
                { [styles.isSelected]: selected }
            )}
        >
            <ConditionalWrap
                condition={!isSummary}
                wrapper={children => (
                    <button type="button" onClick={e => onSelect(e)}>
                        {children}
                    </button>
                )}
            >
                <>
                    <div className={styles.header}>
                        <div className={styles.title}>
                            <span>{title}</span>
                            {onEditClick && <BookingSummaryEditLink onClick={onEditClick} />}
                            {(price || price === 0) && (
                                <div className={styles.price}>{formatAuCurrency(price)}</div>
                            )}
                        </div>
                    </div>

                    <div className={styles.carDetails}>
                        <div className={styles.features}>
                            {description && (
                                <p className={styles.equivalentVehicles}>{description}</p>
                            )}
                            <dl className={styles.capacities}>
                                <dt>
                                    <PassengerIcon aria-hidden="true" />
                                    <span className="sr-only">Passenger capacity:</span>
                                </dt>
                                <dd>max. {maxPassengerCount}</dd>

                                <dt>
                                    <LuggageIcon aria-hidden="true" />
                                    <span className="sr-only">Baggage capacity:</span>
                                </dt>
                                <dd>max. {maxBaggageCount}</dd>
                            </dl>
                        </div>

                        <div className={styles.image}>
                            {image && <img src={image} alt={`${title} vehicle`} />}
                        </div>

                        <div className={styles.footer}>
                            {!isSummary && (
                                <IconButton
                                    text={selected ? 'Selected' : 'Select'}
                                    onSelect={onSelect}
                                    selected={selected}
                                    square
                                />
                            )}
                        </div>
                    </div>
                </>
            </ConditionalWrap>
        </div>
    );
}

VehicleClassDetails.propTypes = {
    title: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    maxPassengerCount: PropTypes.number.isRequired,
    maxBaggageCount: PropTypes.number.isRequired,
    description: PropTypes.string,
    isSummary: PropTypes.bool,
    onSelect: PropTypes.func,
    selected: PropTypes.bool,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onEditClick: PropTypes.func,
};

export default VehicleClassDetails;
