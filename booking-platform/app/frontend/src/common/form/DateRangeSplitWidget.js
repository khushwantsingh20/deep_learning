import useSettings from '@alliance-software/djrad/hooks/useSettings';
import cx from 'classnames';
import moment from 'moment';
import { PropTypes } from 'prop-types';
import React, { useState } from 'react';
import { DatePicker } from 'antd';
import styles from './DateRangeSplitWidget.less';

const defaultSettings = {
    dateFormat: 'MMMM Do YYYY',
    dateDayFormat: 'ddd MMMM Do, YYYY',
    dateTimeFormat: 'MMMM Do YYYY, h:mm a',
};

function convertValue(value) {
    if (!value) {
        return null;
    }
    if (!moment.isMoment(value)) {
        return moment(value);
    }
    return value;
}

export default function DateRangeSplitWidget(props) {
    const settings = useSettings(defaultSettings);
    const [lowerDate, setLowerDate] = useState(null);
    const [upperDate, setUpperDate] = useState(null);

    const {
        upper,
        lower,
        showTime = false,
        format = settings[`${showTime ? 'dateTime' : 'dateDay'}Format`],
        disableDate,
        wrapperClassName,
        ...rest
    } = props;

    function onLowerChange(value) {
        lower.input.onChange(value);
        setLowerDate(value);
        // Set upper range to be the same as the lower if upper range has not been set
        // or the lower range is after the upper range selected date.
        if ((value && value.isAfter(upper.input.value)) || !upper.input.value) {
            upper.input.onChange(value);
        }
    }

    function onUpperChange(value) {
        upper.input.onChange(value);
        setUpperDate(value);
    }

    const disabledLowerDate = lv => {
        if (disableDate && disableDate(lv)) {
            return true;
        }
        if (!lv || !upperDate) {
            return false;
        }
        return lv.valueOf() > upperDate.valueOf();
    };

    const disabledUpperDate = uv => {
        if (disableDate && disableDate(uv)) {
            return true;
        }
        if (!uv || !lowerDate) {
            return false;
        }
        return uv.valueOf() < lowerDate.valueOf();
    };

    return (
        <div className={cx(styles.rangeWrapper, wrapperClassName)}>
            <DatePicker
                disabledDate={disabledLowerDate}
                format={format}
                showTime={showTime}
                value={convertValue(lower.input.value)}
                onChange={onLowerChange}
                {...rest}
            />
            <DatePicker
                disabledDate={disabledUpperDate}
                format={format}
                showTime={showTime}
                value={convertValue(upper.input.value)}
                onChange={onUpperChange}
                {...rest}
            />
        </div>
    );
}

DateRangeSplitWidget.propTypes = {
    value: PropTypes.func,
    format: PropTypes.string,
    showTime: PropTypes.func,
    onBlur: PropTypes.func,
    upper: PropTypes.object,
    lower: PropTypes.object,
    disableDate: PropTypes.func,
    wrapperClassName: PropTypes.string,
};
