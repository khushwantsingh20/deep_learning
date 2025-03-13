import { useState } from 'react';
import moment from 'moment';

// If date is this then date hasn't been selected and should be considered invalid
const INVALID_DATE = '1900-01-07';
// If seconds is this then time hasn't been selected and should be considered invalid
const INVALID_SECOND = 7;

export function validateDateTime(value, isRequired = true) {
    if (!value) {
        if (isRequired) {
            return { isRequired: true };
        }
        return {};
    }
    const d = moment(value);
    if (d.format('YYYY-MM-DD') === INVALID_DATE) {
        return { invalidDate: true };
    }
    if (d.second() === INVALID_SECOND) {
        return { invalidTime: true };
    }
    return {};
}

/**
 * Render date time as split date entry and time entry widgets.
 *
 * NOTE: To validate the value call validateDateTime above. We use magic values in the date to track whether
 * both date and time have been selected.
 * @param onChange On change function that will be called with a moment object if value is selected
 * @param value Current value (moment)
 * @param renderWidgets Called to render widgets. Passed onDateChange, dateValue, onTimeChange, timeValue
 * @param defaultDate If time is set before date set date to this instead of marking the date as invalid
 */
export default function DateTimeSplitWidget({ onChange, value, renderWidgets, defaultDate }) {
    const [isDateSet, setIsDateSet] = useState(!!value);
    const [isTimeSet, setIsTimeSet] = useState(!!value);

    const onDateChange = v => {
        setIsDateSet(!!v);
        let nextValue = null;

        if (v && !isTimeSet) {
            v.set({
                second: INVALID_SECOND,
            });
        }
        if (isTimeSet && value && moment(INVALID_DATE).isSame(value, 'year')) {
            nextValue = v.clone();

            const [hour, minute] = moment(value)
                .format('HH:mm')
                .split(':');
            nextValue.set({
                hour,
                minute,
                second: 0,
            });
        } else {
            nextValue = v;
        }

        onChange(nextValue);
    };
    const onTimeChange = time => {
        setIsTimeSet(!!time);
        let nextValue = null;
        if (time) {
            const [hour, minute] = time.split(':');
            if (value) {
                nextValue = value.clone();
            } else if (defaultDate) {
                nextValue = typeof defaultDate == 'function' ? defaultDate() : defaultDate;
            } else {
                nextValue = moment(INVALID_DATE);
            }
            nextValue.set({
                hour,
                minute,
                second: 0,
            });
        }

        onChange(nextValue);
    };
    return renderWidgets({
        dateValue: isDateSet ? value : null,
        timeValue: isTimeSet ? value : null,
        onDateChange,
        onTimeChange,
    });
}
