import PropTypes from 'prop-types';
import React from 'react';

import TextAreaWidget from '@alliance-software/djrad/components/form/widgets/TextAreaWidget';

export default function DispatchInstructionWidget({ value, onChange, ...rest }) {
    return <TextAreaWidget defaultValue={value} onBlur={onChange} rows={3} {...rest} />;
}

DispatchInstructionWidget.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};
