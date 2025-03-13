import React from 'react';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import ListView from '../../crud/ListView';

import DriverUserFilterForm from '../components/DriverUserFilterForm';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { DriverUser } from '../../../common/user/models';
import ArchiveLink from '../../../common/components/ArchiveLink';

function DriverUserListView(props) {
    const columns = [
        'driverNo',
        'name',
        'mobile',
        'email',
        {
            dataIndex: 'actions',
            render(value, record) {
                return (
                    <ActionLinkList
                        record={record}
                        actions={
                            record.isActive
                                ? ['detail', 'update', 'archive']
                                : ['detail', 'unarchive']
                        }
                        linkComponent={ArchiveLink}
                        linkProps={{ record }}
                    />
                );
            },
        },
    ];

    const renderFilter = filterProps => <DriverUserFilterForm {...filterProps} />;

    return (
        <ListView
            {...props}
            columns={columns}
            renderFilter={renderFilter}
            initialFilterState={{ isActive: true }}
            sortableFields={['name', 'email', 'isActive']}
            partialRecordFieldNames={['driverNo', 'name', 'mobile', 'email', 'isActive']}
        />
    );
}

export default requirePermissions({ action: 'list', model: DriverUser })(DriverUserListView);
