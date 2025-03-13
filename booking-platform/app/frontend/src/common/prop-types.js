/* eslint consistent-return: 0 */

/**
 * Helper to create prop type checker that supports .isRequired
 *
 * (taken from djrad)
 */
function createChainableTypeChecker(validate) {
    function checkType(isRequired, props, propName, componentName, location) {
        if (props[propName] == null) {
            if (isRequired) {
                return new Error(`Required ${propName} was not specified in ${componentName}`);
            }
            return null;
        }
        return validate(props, propName, componentName, location);
    }

    const chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
}

/**
 * Check if a prop is numeric - either a Number or a String that looks like a number
 */
export const numeric = createChainableTypeChecker((props, propName, componentName) => {
    const value = props[propName];
    if (Number.isNaN(Number(value))) {
        return new Error(
            `Prop ${propName} passed to ${componentName} should be a number or a string that looks like a number, received: ${value}`
        );
    }
});
