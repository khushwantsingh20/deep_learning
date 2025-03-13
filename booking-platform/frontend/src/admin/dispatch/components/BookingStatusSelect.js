import React, { useEffect, useState } from 'react';
import Button from 'antd/lib/button/button';
import cx from 'classnames';

import { DispatchBooking } from '../models';

import styles from '../dispatch.less';

export default function BookingStatusSelect({ value, onChange }) {
    const choices = [[0, 'All'], ['Active', 'Active']].concat(
        Array.from(DispatchBooking._meta.fields.bookingStatus.choices)
    );
    const [selected, setSelected] = useState({});
    useEffect(() => {
        const newState = {};
        for (const entry of value) {
            newState[entry] = true;
        }
        if (JSON.stringify(newState) !== JSON.stringify(selected)) {
            setSelected(newState);
        }
    }, [value, selected, setSelected]);
    const anyActive = Object.keys(selected).length !== 0;
    const toggle = v => {
        if (v === 0) {
            // Toggle 'all' on by switching all status-filtering off
            if (anyActive) {
                onChange([]);
            }
            return;
        }
        if (value.includes(v)) {
            onChange(value.filter(entry => entry !== v));
        } else {
            onChange(value.concat([v]));
        }
    };

    return choices.map(([optionId, optionName]) => (
        <Button
            key={optionId}
            className={cx(styles.statusFilterButton, {
                [styles.statusFilterActive]:
                    selected[String(optionId)] || (optionId === 0 && !anyActive),
            })}
            onClick={() => toggle(optionId)}
        >
            {optionName}
        </Button>
    ));
}
