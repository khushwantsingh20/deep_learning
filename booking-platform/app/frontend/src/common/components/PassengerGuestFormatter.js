import cx from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import FieldFormatter from '@alliance-software/djrad/components/model/FieldFormatter';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';

import ScbpModelForm from '../data/ScbpModelForm';

import styles from './PassengerGuestLookupWidget.less';

/**
 * Guest display - used on admin booking screen when booking is completed (and uneditable)
 */
export default function PassengerGuestFormatter({ layout = 'vertical', booking }) {
    const wrapperCol = layout === 'vertical' ? { xs: { span: 24 }, md: { span: 16 } } : null;
    const labelCol = layout === 'vertical' ? { xs: { span: 24 }, md: { span: 8 } } : null;
    return (
        <div className={cx(styles.lookupWidget, styles[layout])}>
            <ScbpModelForm.Item
                name="passengerName"
                label="Name"
                wrapperCol={wrapperCol}
                labelCol={labelCol}
                widget={<FieldFormatter fieldName="passengerName" record={booking} />}
            />

            <ScbpModelForm.Item
                wrapperCol={wrapperCol}
                labelCol={labelCol}
                name="passengerPhone"
                label="Phone Number"
            />
        </div>
    );
}

PassengerGuestFormatter.propTypes = {
    booking: modelInstance('scbp_core.booking').isRequired,
    layout: PropTypes.oneOf(['vertical', 'horizontal']),
};
