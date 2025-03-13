import React from 'react';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import ListView from '../../crud/ListView';

import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { VehicleOperator } from '../models';
import ArchiveLink from '../../../common/components/ArchiveLink';

function VehicleOperatorListView(props) {
    const columns = [
        'vehicleOperatorNo',
        'companyName',
        'contactFullName',
        'contactMobile',
        {
            dataIndex: 'actions',
            render(value, record) {
                return (
                    <ActionLinkList
                        record={record}
                        actions={['detail', 'update', 'archive']}
                        linkComponent={ArchiveLink}
                        linkProps={{ record }}
                    />
                );
            },
        },
    ];

    return <ListView {...props} columns={columns} />;
}

export default requirePermissions({ action: 'list', model: VehicleOperator })(
    VehicleOperatorListView
);
