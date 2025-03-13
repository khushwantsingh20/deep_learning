import { Input } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import ScbpModelForm from '../../../common/data/ScbpModelForm';

import styles from '../dispatch.less';

const { Field } = ScbpModelForm;

function DispatchTimeWidget(props) {
    const { value } = props;
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        setDisplayValue(value);
    }, [props, value]); // using props as a dependency to ensure reset on invalid input

    const updateValue = event => {
        const newValue = event.target.value.replace(/[^\d]/, '').substring(0, 4);
        setDisplayValue(newValue);
    };

    return (
        <Input
            className={styles.dispatchTimeInput}
            disabled={props.disabled}
            onChange={updateValue}
            onBlur={props.onChange}
            value={displayValue}
        />
    );
}

DispatchTimeWidget.propTypes = {
    disabled: PropTypes.bool,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
};

DispatchTimeWidget.defaultProps = {
    disabled: false,
};

export default function DispatchTimeField({ required, ...props }) {
    const format = value => {
        return value ? moment(value).format('HHmm') : '';
    };

    const normalize = (value, previousValue) => {
        const newValue = previousValue ? moment(previousValue) : moment();
        const parseResult = moment(value, ['HHmm', 'Hmm'], true);
        if (parseResult.isValid()) {
            newValue.hour(parseResult.hour()).minute(parseResult.minute());
            return newValue;
        } else if (required) {
            return newValue;
        }
        return null;
    };

    return <Field {...props} format={format} normalize={normalize} widget={DispatchTimeWidget} />;
}

DispatchTimeField.propTypes = {
    required: PropTypes.bool,
};
