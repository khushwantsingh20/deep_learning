import React from 'react';

import DayHourTable from '../components/DayHourTable';
import { BookingLeadTime } from '../models';

export default function BookingLeadTimeView() {
    return (
        <DayHourTable
            fieldName="leadTime"
            model={BookingLeadTime}
            title="Booking Lead Times"
            minuteStep={5}
        />
    );
}
