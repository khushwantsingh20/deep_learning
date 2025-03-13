import React from 'react';

import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';

import { PriceAdjustment } from '../models';
import ListView from '../../crud/ListView';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';

function RawPriceAdjustmentListView(props) {
    const columns = [
        'fromPostcode',
        'toPostcode',
        {
            dataIndex: 'percentage',
            render(value) {
                if (value > 0) {
                    return `+${value}%`;
                }
                return `${value}%`;
            },
        },
        {
            dataIndex: 'actions',
            render(value, record) {
                return (
                    <ActionLinkList
                        record={record}
                        actions={['detail', 'update', 'delete']}
                        linkProps={{ record }}
                    />
                );
            },
        },
    ];
    return <ListView {...props} columns={columns} />;
}

export default requirePermissions({ action: 'list', model: PriceAdjustment })(
    RawPriceAdjustmentListView
);
