import { Select } from 'antd';
import padStart from 'lodash/padStart';
import range from 'lodash/range';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './DurationWidget.less';

export function parseDuration(value) {
    const parts = value.split(' ');
    if (parts.length > 2 || parts.length < 1 || value.split(':').length !== 3) {
        throw new Error(`Invalid duration string: ${value}`);
    }
    if (value.includes('.')) {
        throw new Error(`Milliseconds not supported: ${value}`);
    }
    if (parts.length === 2) {
        const [days, time] = parts;
        const [hours, minutes, seconds] = time.split(':');
        return {
            days,
            hours,
            minutes,
            seconds,
        };
    }
    const [hours, minutes, seconds] = value.split(':');
    return { hours, minutes, seconds };
}

const pad = value => padStart(value, 2, '0');

function durationString({ hours = 0, minutes = 0, seconds = 0, days }) {
    const timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    if (days) {
        return `${days} ${timeString}`;
    }
    return timeString;
}

/**
 * Display a duration select widget that works with django duration fields
 *
 * A duration field is of the format:
 *
 * * 23:59:59 - (23 hours, 59 minutes, 59 seconds)
 * * 1 02:00:00 - (1 day, 2 hours)
 * * 2 07:00:00.000005 - (2 days, 7 hours and 5 milliseconds)
 *
 * Currently we only allow selection of hours and minutes.
 */
export default function DurationWidget({
    value,
    onChange,
    minuteStep = 1,
    minDurationMinutes = 0,
    maxDurationMinutes = 24 * 60,
}) {
    const { days, hours, minutes, seconds } = value ? parseDuration(value) : {};
    const hourOptions = range(0, 24)
        .filter(h => {
            const totalMinutes = h * 60;
            return (
                totalMinutes <= maxDurationMinutes &&
                (totalMinutes >= minDurationMinutes || (h === 0 && minDurationMinutes < 60))
            );
        })
        .map(hour => (
            <Select.Option value={pad(hour)} key={hour}>
                {hour} hour{hour === 1 ? '' : 's'}
            </Select.Option>
        ));
    const minuteOptions = range(0, 60, minuteStep)
        .filter(m => {
            const totalMinutes = m + (hours || 0) * 60;
            return totalMinutes <= maxDurationMinutes && totalMinutes >= minDurationMinutes;
        })
        .map(minute => (
            <Select.Option value={pad(minute)} key={minute}>
                {minute} minute{minute === 1 ? '' : 's'}
            </Select.Option>
        ));
    if (days) {
        throw new Error('Days support not implemented');
    }
    const handleChangeHours = nextHours => {
        onChange(durationString({ hours: nextHours, minutes, seconds, days }));
    };
    const handleChangeMinutes = nextMinutes => {
        onChange(durationString({ hours, minutes: nextMinutes, seconds, days }));
    };
    return (
        <>
            <Select className={styles.select} value={hours} onChange={handleChangeHours}>
                {hourOptions}
            </Select>

            <Select className={styles.select} value={minutes} onChange={handleChangeMinutes}>
                {minuteOptions}
            </Select>
        </>
    );
}

DurationWidget.propTypes = {
    /**
     * A valid duration string
     */
    value: PropTypes.string,
    /**
     * Step value for minute options
     */
    minuteStep: PropTypes.number,
    maxDurationMinutes: PropTypes.number,
    minDurationMinutes: PropTypes.number,
    onChange: PropTypes.func.isRequired,
};
