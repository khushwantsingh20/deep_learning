import PropTypes from 'prop-types';
import ChoicesWidget from '@alliance-software/djrad/components/form/widgets/ChoicesWidget';
import React from 'react';

export default function NumericChoicesWidget({ min = 0, max, allowClear = false, ...rest }) {
    const choices = [];
    for (let i = min; i <= max; i++) {
        choices.push([i, i]);
    }
    return <ChoicesWidget choices={choices} allowClear={allowClear} {...rest} />;
}
NumericChoicesWidget.propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    allowClear: PropTypes.number,
};
