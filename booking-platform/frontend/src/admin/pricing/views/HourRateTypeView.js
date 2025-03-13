import React from 'react';

import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { HourRateType } from '../models';
import DayHourTable from '../components/DayHourTable';

function HourRateTypeView() {
    return <DayHourTable fieldName="hourType" model={HourRateType} title="Peak Settings" />;
}

export default requirePermissions({ action: 'list', model: HourRateType })(HourRateTypeView);
