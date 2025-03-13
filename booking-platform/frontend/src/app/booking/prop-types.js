import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';

function createChainableTypeChecker(validate) {
    function checkType(isRequired, props, propName, componentName, location) {
        if (props[propName] == null) {
            if (isRequired) {
                return new Error(
                    `Required prop '${propName}' was not specified in ${componentName}`
                );
            }
            return null;
        }
        return validate(props, propName, componentName, location);
    }

    const chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
}

// Key is vehicle class ID, value is of shape { vehicleClassId: X, price: '123' }
const vehicleClassPrices = PropTypes.object;

export default {
    vehicleClassPrices,
    bookingContext: PropTypes.shape({
        // Will be set after step 2
        vehicleClass: modelInstance('scbp_core.vehicleclass'),
        // Always available
        vehicleClasses: ImmutablePropTypes.listOf(modelInstance('scbp_core.vehicleclass'))
            .isRequired,
        passengerCountLimit: PropTypes.number.isRequired,
        baggageCountLimit: PropTypes.number.isRequired,
        vehicleClassPrices,
    }),
    /**
     * Verify value matches valid choices as defined on a type in choicesConstants
     */
    choicesType: type =>
        createChainableTypeChecker((props, propName) => {
            const value = props[propName];
            const validOptions = [];
            for (const choice of Object.values(type)) {
                if (choice.value === value) {
                    return;
                }
                validOptions.push(choice.value);
            }
            // eslint-disable-next-line consistent-return
            return new Error(
                `Invalid value ${value} for choice. Valid options: ${validOptions.join(', ')}`
            );
        }),
};
