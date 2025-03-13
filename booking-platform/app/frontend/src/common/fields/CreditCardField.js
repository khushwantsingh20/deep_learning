import React from 'react';
import PropTypes from 'prop-types';
import Field from '@alliance-software/djrad/model/fields/Field';

// TODO: Expand this later once we know how we want to display these
export function CreditCardFormatter(props) {
    return props.value
        ? `Expires: ${props.value.expMonth}/${props.value.expYear}  Last Digits: ${props.value.last4}`
        : '';
}

CreditCardFormatter.propTypes = {
    value: PropTypes.object,
};

export default class CreditCardField extends Field {
    getDefaultFormatter(props) {
        return <CreditCardFormatter {...props} />;
    }
}
