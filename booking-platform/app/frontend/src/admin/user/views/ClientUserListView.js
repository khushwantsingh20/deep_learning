import React from 'react';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import ArchiveLink from '../../../common/components/ArchiveLink';
import ListView from '../../crud/ListView';
import { ClientUser } from '../../user/models';

import ClientUserFilterForm from '../components/ClientUserFilterForm';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { adminListActionsWithArchive, adminListActionsArchivedUser } from './UserListView';

function ClientUserListView(props) {
    const columns = [
        'name',
        'email',
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

    const renderFilter = filterProps => <ClientUserFilterForm {...filterProps} />;

    return (
        <ListView
            {...props}
            columns={columns}
            renderFilter={renderFilter}
            sortableFields={['name', 'email']}
            initialFilterState={{ isActive: true }}
            partialRecordFieldNames={['name', 'email', 'isActive']}
        />
    );
}

export default requirePermissions({ action: 'list', model: ClientUser })(ClientUserListView);
