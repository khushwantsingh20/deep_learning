import { Select } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './TimeWidget.less';

/**
 * Time picker. Uses ant.design `TimePicker`.
 * @see [TimePicker](https://ant.design/components/time-picker) for all available props.
 */
export default function TimeWidget(props) {
    // Prop destructure
    const {
        value,
        showSeconds = false,
        format = showSeconds ? 'h:mm:ss A' : 'h:mm A',
        onChange,
        minuteStep = 1,
    } = props;
    const serverFormat = showSeconds ? 'HH:mm:ss' : 'HH:mm';

    // Initial value processing
    let finalValue = value;
    if (finalValue && !moment.isMoment(finalValue)) {
        finalValue = moment(finalValue, format);
    }
    if (finalValue === '') {
        finalValue = null;
    }

    // Setting option values
    const hourOptions = [...Array(24).keys()].map(hour => (
        <Select.Option
            dispvalue={moment({ hour }).format('h')}
            key={hour}
            className={styles.TimeWidgetOption}
            value={hour}
        >
            {moment({ hour }).format('h A')}
        </Select.Option>
    ));
    const minuteOptions = [...Array(60).keys()]
        .filter(minute => minute % minuteStep === 0)
        .map(minute => (
            <Select.Option className={styles.TimeWidgetOption} key={minute} value={minute}>
                {moment({ minute }).format('mm')}
            </Select.Option>
        ));
    const secondOptions = [...Array(60).keys()].map(second => (
        <Select.Option className={styles.TimeWidgetOption} key={second} value={second}>
            {moment({ second }).format('ss')}
        </Select.Option>
    ));

    // Value change handlers
    const onChangeValue = handler => {
        const newValue = finalValue
            ? finalValue.clone()
            : moment({ hour: 0, minute: 0, second: 0 });
        handler(newValue);
        onChange(newValue.format(serverFormat));
    };
    const onChangeHour = newHour => onChangeValue(newValue => newValue.hour(newHour));
    const onChangeMinute = newMinute => onChangeValue(newValue => newValue.minute(newMinute));
    const onChangeSecond = newSecond => onChangeValue(newValue => newValue.second(newSecond));

    // Include globally targetable class name here for use with eg. BookingValueWidget
    const WidgetClassName = `sc-timewidget ${styles.TimeWidget} ${
        showSeconds ? styles.TimeWidgetWithSeconds : styles.TimeWidgetWithoutSeconds
    }`;

    return (
        <div className={WidgetClassName}>
            <div className={`${styles.TimeWidgetSelectWrapper} TimeWidgetSelectHourWrapper`}>
                <Select
                    className={styles.TimeWidgetSelect}
                    onChange={onChangeHour}
                    optionLabelProp="dispvalue"
                    value={finalValue && finalValue.hour()}
                    showSearch
                >
                    {hourOptions}
                </Select>
            </div>
            <span className={styles.TimeWidgetSeparator}>:</span>
            <div className={`${styles.TimeWidgetSelectWrapper} TimeWidgetSelectMinuteWrapper`}>
                <Select
                    showSearch
                    onChange={onChangeMinute}
                    value={finalValue && finalValue.minute()}
                >
                    {minuteOptions}
                </Select>
            </div>
            {showSeconds && (
                <>
                    <span className={styles.TimeWidgetSeparator}>:</span>
                    <div
                        className={`${styles.TimeWidgetSelectWrapper} TimeWidgetSelectSecondWrapper`}
                    >
                        <Select onChange={onChangeSecond} value={finalValue && finalValue.second()}>
                            {secondOptions}
                        </Select>
                    </div>
                </>
            )}
            {finalValue && (
                <div className={styles.TimeWidgetHalfDayDisplay}>{finalValue.format('A')}</div>
            )}
        </div>
    );
}

TimeWidget.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    showSeconds: PropTypes.bool,
    format: PropTypes.string,
    minuteStep: PropTypes.number,
    onChange: PropTypes.func.isRequired,
};
