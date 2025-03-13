import { Button, DatePicker } from 'antd';
import moment from 'moment';
import { PropTypes } from 'prop-types';
import React from 'react';

const { MonthPicker } = DatePicker;

export default function MonthWidget(props) {
    const { value, format = 'MMM YYYY', onBlur, ...rest } = props;
    let finalValue = value;
    if (finalValue && !moment.isMoment(finalValue)) {
        finalValue = moment(finalValue);
    }
    if (finalValue === '') {
        finalValue = null;
    }
    // We can't just pass through onBlur directly as it will end up accessing the raw
    // string value which is hard to work with as we don't know the format. Instead
    // we wrap the onBlur and pass it explicitly the value after we have converted it
    // to a moment instance which we can do as we know what the format string is.
    const wrappedOnBlur = e => {
        let { value: blurValue } = e.target;
        if (blurValue && !moment.isMoment(blurValue)) {
            blurValue = moment(blurValue, format);
        }
        if (blurValue) {
            onBlur({ month: blurValue.month(), year: blurValue.year() });
        }
    };

    // Handler for the click buttons
    const handleNextMonth = () => {
        const newValue = moment(finalValue).add(1, 'month');
        onBlur({ month: newValue.month(), year: newValue.year() });
    };

    const handlePreviousMonth = () => {
        const newValue = moment(finalValue).subtract(1, 'month');
        onBlur({ month: newValue.month(), year: newValue.year() });
    };

    return (
        <>
            <Button icon="left" onClick={handlePreviousMonth} />
            <MonthPicker
                allowClear={false}
                format={format}
                value={finalValue}
                onBlur={wrappedOnBlur}
                {...rest}
            />
            <Button icon="right" onClick={handleNextMonth} />
        </>
    );
}

MonthWidget.propTypes = {
    value: PropTypes.oneOfType([
        PropTypes.instanceOf(moment),
        PropTypes.shape({
            month: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        }),
    ]),
    format: PropTypes.string,
    onBlur: PropTypes.func,
};
