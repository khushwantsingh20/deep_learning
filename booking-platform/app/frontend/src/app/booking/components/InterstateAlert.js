import { Alert } from 'antd';
import React from 'react';

export default function InterstateAlert() {
    return (
        <Alert
            message="Bookings not in Victoria will be serviced by our affiliate. Total charge will be passed on at cost plus an $11 booking fee, as shown below."
            showIcon
            style={{ marginBottom: '8px' }}
            type="warning"
        />
    );
}
