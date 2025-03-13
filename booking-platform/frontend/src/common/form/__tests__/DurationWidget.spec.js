import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import DurationWidget, { parseDuration } from '../DurationWidget';

test('DurationWidget should support hours and minutes', () => {
    const onChange = jest.fn();
    const { rerender, getByText, getAllByLabelText } = render(
        <DurationWidget value="00:00:00" onChange={onChange} />
    );
    expect(getByText('0 hours')).toBeInTheDocument();
    expect(getByText('0 minutes')).toBeInTheDocument();

    rerender(<DurationWidget value="23:59:00" onChange={onChange} />);
    expect(getByText('23 hours')).toBeInTheDocument();
    expect(getByText('59 minutes')).toBeInTheDocument();

    rerender(<DurationWidget value="01:01:00" onChange={onChange} />);
    expect(getByText('1 hour')).toBeInTheDocument();
    expect(getByText('1 minute')).toBeInTheDocument();

    const makeSelection = (index, selection) => {
        fireEvent(
            getAllByLabelText('icon: down')[index],
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
        fireEvent(
            getByText(selection),
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            })
        );
    };
    const selectHours = h => makeSelection(0, h);
    const selectMinutes = m => makeSelection(1, m);
    selectHours('10 hours');
    expect(onChange).toHaveBeenCalledWith('10:01:00');
    selectHours('23 hours');
    expect(onChange).toHaveBeenCalledWith('23:01:00');
    selectMinutes('5 minutes');
    expect(onChange).toHaveBeenCalledWith('01:05:00');
    selectMinutes('0 minutes');
    expect(onChange).toHaveBeenCalledWith('01:00:00');
    selectMinutes('59 minutes');
    expect(onChange).toHaveBeenCalledWith('01:59:00');

    fireEvent(
        getAllByLabelText('icon: down')[0],
        new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        })
    );
});

test('DurationWidget should support minuteStep option', () => {
    const onChange = jest.fn();
    const { rerender, getByText, getAllByLabelText, getAllByRole } = render(
        <DurationWidget value="00:00:00" minuteStep={5} onChange={onChange} />
    );
    expect(getByText('0 hours')).toBeInTheDocument();
    expect(getByText('0 minutes')).toBeInTheDocument();
    fireEvent(
        getAllByLabelText('icon: down')[1],
        new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        })
    );
    const options = getAllByRole('option');
    expect(options.length).toBe(12);
    expect(options.map(option => option.textContent)).toEqual([
        '0 minutes',
        '5 minutes',
        '10 minutes',
        '15 minutes',
        '20 minutes',
        '25 minutes',
        '30 minutes',
        '35 minutes',
        '40 minutes',
        '45 minutes',
        '50 minutes',
        '55 minutes',
    ]);
    options.map(option => option.textContent);
    rerender(<DurationWidget value="00:00:00" minuteStep={15} onChange={onChange} />);
    expect(getAllByRole('option').map(option => option.textContent)).toEqual([
        '0 minutes',
        '15 minutes',
        '30 minutes',
        '45 minutes',
    ]);
});

test.each`
    duration               | value
    ${'01:03:04'}          | ${{ hours: '01', minutes: '03', seconds: '04' }}
    ${'23:59:59'}          | ${{ hours: '23', minutes: '59', seconds: '59' }}
    ${'2 07:00:00'}        | ${{ days: '2', hours: '07', minutes: '00', seconds: '00' }}
    ${'01:03'}             | ${new Error('Invalid duration string')}
    ${'5 01:03'}           | ${new Error('Invalid duration string')}
    ${'5 01:03:02 3'}      | ${new Error('Invalid duration string')}
    ${'2 07:00:00.000005'} | ${new Error('Milliseconds not supported')}
`('Parse duration: $duration = $value', async ({ duration, value }) => {
    if (value instanceof Error) {
        expect(() => parseDuration(duration)).toThrow(value.message);
    } else {
        expect(parseDuration(duration)).toEqual(value);
    }
});
