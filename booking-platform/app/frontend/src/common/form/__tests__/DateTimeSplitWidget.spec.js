import { render, fireEvent } from '@testing-library/react';
import moment from 'moment';
import React from 'react';
import DateTimeSplitWidget, { validateDateTime } from '../DateTimeSplitWidget';

// eslint-disable-next-line
const renderWidgets = ({ dateValue, onDateChange, timeValue, onTimeChange }) => (
    <>
        <input
            onChange={e => onDateChange(moment(e.target.value))}
            data-testid="date"
            value={dateValue ? dateValue.format('YYYY-MM-DD') : ''}
        />
        <input
            onChange={e => onTimeChange(e.target.value)}
            data-testid="time"
            value={timeValue ? timeValue.format('HH:mm') : ''}
        />
    </>
);

test('DateTimeSplitWidget should validate time when date set', () => {
    const onChange = jest.fn();
    const { rerender, getByTestId } = render(
        <DateTimeSplitWidget value={null} onChange={onChange} renderWidgets={renderWidgets} />
    );

    fireEvent.change(getByTestId('date'), { target: { value: '2019-01-01' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    let lastValue = onChange.mock.calls[0][0];
    expect(lastValue.seconds()).toBe(7);
    expect(validateDateTime(lastValue)).toEqual({ invalidTime: true });
    rerender(
        <DateTimeSplitWidget value={lastValue} onChange={onChange} renderWidgets={renderWidgets} />
    );
    fireEvent.change(getByTestId('time'), { target: { value: '03:55' } });
    expect(onChange).toHaveBeenCalledTimes(2);
    lastValue = onChange.mock.calls[1][0];
    expect(lastValue.seconds()).toBe(0);
    expect(lastValue.format('YYYY-MM-DD HH:mm')).toBe('2019-01-01 03:55');
    expect(validateDateTime(lastValue)).toEqual({});
});

test('DateTimeSplitWidget should validate date when time set', () => {
    const onChange = jest.fn();
    const { rerender, getByTestId } = render(
        <DateTimeSplitWidget value={null} onChange={onChange} renderWidgets={renderWidgets} />
    );

    fireEvent.change(getByTestId('time'), { target: { value: '03:55' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    let lastValue = onChange.mock.calls[0][0];
    expect(validateDateTime(lastValue)).toEqual({ invalidDate: true });
    rerender(
        <DateTimeSplitWidget value={lastValue} onChange={onChange} renderWidgets={renderWidgets} />
    );
    fireEvent.change(getByTestId('date'), { target: { value: '2019-01-01' } });
    expect(onChange).toHaveBeenCalledTimes(2);
    lastValue = onChange.mock.calls[1][0];
    expect(validateDateTime(lastValue)).toEqual({});
});

test('DateTimeSplitWidget should handle initial value', () => {
    const onChange = jest.fn();
    const initial = moment('2019-01-01 03:55:00');
    const { getByTestId } = render(
        <DateTimeSplitWidget value={initial} onChange={onChange} renderWidgets={renderWidgets} />
    );

    expect(getByTestId('time')).toHaveValue('03:55');
    expect(getByTestId('date')).toHaveValue('2019-01-01');
});
