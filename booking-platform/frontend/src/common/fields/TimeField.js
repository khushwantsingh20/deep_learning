import React from 'react';
import moment from 'moment';
import Field from '@alliance-software/djrad/model/fields/Field';
import TimeWidget from '../form/TimeWidget';

export default class TimeField extends Field {
    getDefaultWidget(props) {
        return <TimeWidget {...props} />;
    }

    getDefaultFormatter({ value }) {
        if (value) {
            return moment(value, 'HH:mm:ss').format('h:mm A');
        }
        return null;
    }
}
