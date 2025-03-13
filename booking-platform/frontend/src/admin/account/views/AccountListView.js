import React from 'react';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import { getColumnFieldNames } from '../../../common/data/util';
import ListView from '../../crud/ListView';

import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { Account } from '../../../common/user/models';
import ArchiveLink from '../../../common/components/ArchiveLink';
import AccountFilterForm from '../components/AccountFilterForm';

function AccountListView(props) {
    const columns = [
        'accountNo',
        'accountNickname',
        'rateSchedule',
        'paymentMethod',
        {
            dataIndex: 'actions',
            render(value, record) {
                return (
                    <ActionLinkList
                        record={record}
                        actions={['detail', 'update', record.archivedAt ? 'unarchive' : 'archive']}
                        linkComponent={ArchiveLink}
                        linkProps={{ record }}
                    />
                );
            },
        },
    ];

    const renderFilter = filterProps => <AccountFilterForm {...filterProps} />;
    const partialRecordFieldNames = [...getColumnFieldNames(Account, columns), 'archivedAt'];
    return (
        <ListView
            {...props}
            columns={columns}
            renderFilter={renderFilter}
            partialRecordFieldNames={partialRecordFieldNames}
            sortableFields={['accountNo', 'accountNickname']}
        />
    );
}

export default requirePermissions({ action: 'list', model: Account })(AccountListView);
