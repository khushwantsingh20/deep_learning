import React from 'react';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import ListView from '../../crud/ListView';

import AdminFilterForm from '../components/StaffFilterForm';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { StaffUser } from '../models';
import { adminListActionsWithArchive, adminListActionsArchivedUser } from './UserListView';
import ArchiveLink from '../../../common/components/ArchiveLink';

function StaffUserListView(props) {
    const columns = [
        'name',
        'email',
        'userType',
        {
            dataIndex: 'actions',
            render(value, record) {
                return (
                    <ActionLinkList
                        record={record}
                        actions={
                            record.isActive
                                ? adminListActionsWithArchive
                                : adminListActionsArchivedUser
                        }
                        linkComponent={ArchiveLink}
                        linkProps={{ record }}
                    />
                );
            },
        },
    ];

    const renderFilter = filterProps => <AdminFilterForm {...filterProps} />;

    return (
        <ListView
            {...props}
            columns={columns}
            renderFilter={renderFilter}
            initialFilterState={{ isActive: true }}
            sortableFields={['name', 'email']}
            partialRecordFieldNames={['name', 'email', 'userType', 'isActive']}
        />
    );
}

export default requirePermissions({ action: 'list', model: StaffUser })(StaffUserListView);
