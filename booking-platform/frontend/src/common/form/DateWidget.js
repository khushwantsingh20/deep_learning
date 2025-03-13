import useSettings from '@alliance-software/djrad/hooks/useSettings';
import { DatePicker } from 'antd';
import createPicker from 'antd/lib/date-picker/createPicker';
import wrapPicker from 'antd/lib/date-picker/wrapPicker';
import moment from 'moment';
import { PropTypes } from 'prop-types';
import RcCalendar from 'rc-calendar';
import * as React from 'react';
import useBreakpoint from '../hooks/useBreakpoint';

const defaultSettings = {
    dateFormat: 'MMMM Do YYYY',
    dateTimeFormat: 'MMMM Do YYYY, h:mm a',
};

function CalendarNoInput(props) {
    return <RcCalendar showDateInput={false} {...props} />;
}

const DatePickerNoInput = wrapPicker(createPicker(CalendarNoInput), 'date');

/**
 * Date / Time picker. Uses ant.design `DatePicker`.
 * @see [DatePicker](https://ant.design/components/date-picker) for all available props.
 */
export default function DateWidget(props) {
    const settings = useSettings(defaultSettings);
    const { isMobile } = useBreakpoint();
    const {
        value,
        showTime = false,
        format = settings[`${showTime ? 'dateTime' : 'date'}Format`],
        onBlur,
        ...rest
    } = props;
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
        onBlur(blurValue);
    };

    if (isMobile) {
        return (
            <DatePickerNoInput
                format={format}
                showTime={showTime}
                value={finalValue}
                onBlur={wrappedOnBlur}
                {...rest}
            />
        );
    }

    return (
        <DatePicker
            format={format}
            showTime={showTime}
            value={finalValue}
            onBlur={wrappedOnBlur}
            {...rest}
        />
    );
}

DateWidget.propTypes = {
    value: PropTypes.oneOfType([PropTypes.instanceOf(moment), PropTypes.string]),
    format: PropTypes.string,
    showTime: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf([{}])]),
    onBlur: PropTypes.func,
};
