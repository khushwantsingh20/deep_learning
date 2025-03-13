import React from 'react';
import Field from '@alliance-software/djrad/model/fields/Field';
import DurationWidget from '../form/DurationWidget';

export default class DurationField extends Field {
    getDefaultWidget(props) {
        return <DurationWidget {...props} />;
    }
}
