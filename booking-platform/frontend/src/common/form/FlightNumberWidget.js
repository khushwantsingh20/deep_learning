import InputWidget from '@alliance-software/djrad/components/form/widgets/InputWidget';
import { Button } from 'antd';
import React from 'react';
import PropTypes from 'prop-types';

function FlightNumberWidget({ onBlur, ...props }) {
    const wrappedOnBlur = e => {
        let value = e.target.value;
        if (value.match(/^([A-Za-z]{2}\s)(.*)$/)) {
            value = value.toUpperCase();
        } else if (value.match(/^([A-Za-z]{2})(.*)$/)) {
            value = value.replace(/^([A-Za-z]{2})(.*)$/, '$1 $2').toUpperCase();
        }
        onBlur(value);
    };
    return (
        <>
            <InputWidget {...props} onBlur={wrappedOnBlur} />
            <Button
                type="link"
                onClick={() => {
                    onBlur(null);
                }}
            >
                Clear
            </Button>
        </>
    );
}

export default FlightNumberWidget;

FlightNumberWidget.propTypes = {
    onBlur: PropTypes.func,
};
