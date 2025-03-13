import React from 'react';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import ListView from '../../crud/ListView';

import UserFilterForm from '../components/UserFilterForm';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { StaffUser, User, ClientUser } from '../models';

export const adminListActions = ['detail', 'update', 'impersonate']; // we probably dont want to delete users ever - what cant be solved by inactivate them?
export const adminListActionsWithArchive = ['detail', 'update', 'impersonate', 'archive']; // we probably dont want to delete users ever - what cant be solved by inactivate them?
export const adminListActionsArchivedUser = ['detail', 'unarchive'];

function UserListView(props) {
    const columns = [
        'name',
        'userType',
        'email',
        'isActive',
        {
            dataIndex: 'actions',
            render(value, record) {
                if (!record.userType) {
                    return (
                        <ActionLinkList
                            record={record}
                            actions={
                                record.isActive ? adminListActions : adminListActionsArchivedUser
                            }
                        />
                    );
                }
                if (record.userType === 'staff') {
                    return (
                        <ActionLinkList
                            model={StaffUser}
                            recordId={record.getId()}
                            actions={
                                record.isActive
                                    ? adminListActionsWithArchive
                                    : adminListActionsArchivedUser
                            }
                        />
                    );
                }
                if (record.userType === 'client') {
                    return (
                        <ActionLinkList
                            model={ClientUser}
                            recordId={record.getId()}
                            actions={
                                record.isActive ? adminListActions : adminListActionsArchivedUser
                            }
                        />
                    );
                }
                // eslint-disable-next-line
                console.error(
                    `Unknown user profile type ${record.userType} - no action links shown`
                );
                return null;
            },
        },
    ];

    const renderFilter = filterProps => <UserFilterForm {...filterProps} />;

    return (
        <ListView
            {...props}
            columns={columns}
            renderFilter={renderFilter}
            initialFilterState={{ isActive: true }}
            sortableFields={['name', 'email', 'isActive', 'userType']}
            partialRecordFieldNames={['name', 'userType', 'email', 'isActive']}
        />
    );
}

export default requirePermissions({ action: 'list', model: User })(UserListView);
