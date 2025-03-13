import React from 'react';
import PropTypes from 'prop-types';
import Field from '@alliance-software/djrad/model/fields/Field';
import AddressLookupWidget from '../form/AddressLookupWidget';

// TODO: Expand this later once we know how we want to display these
export function AddressFormatter(props) {
    return props.value ? props.value.formattedAddress : '';
}

AddressFormatter.propTypes = {
    value: PropTypes.object,
};

export default class AddressField extends Field {
    getDefaultWidget(props) {
        return <AddressLookupWidget {...props} />;
    }

    getDefaultFormatter(props) {
        return <AddressFormatter {...props} />;
    }
}
