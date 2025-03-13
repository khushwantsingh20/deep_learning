import React from 'react';
import PropTypes from 'prop-types';
import ChoicesWidget from '@alliance-software/djrad/components/form/widgets/ChoicesWidget';

export default function BooleanSelectWidget({ onChange, value, allowClear, onBlur, ...rest }) {
    return (
        <ChoicesWidget
            onBlur={newValue => onBlur(newValue === 'true')}
            onChange={onChange}
            value={value}
            type="select"
            choices={[[true, 'Yes'], [false, 'No']]}
            allowClear={allowClear}
            {...rest}
        />
    );
}

BooleanSelectWidget.propTypes = {
    onBlur: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.bool,
    allowClear: PropTypes.bool,
};
