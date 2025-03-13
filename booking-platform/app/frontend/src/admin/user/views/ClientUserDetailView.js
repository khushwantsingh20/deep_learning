import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import React from 'react';
import { Account } from '../../../common/user/models';
import DetailView from '../../crud/DetailView';
import { ClientUser } from '../../user/models';

import requirePermissions from '../../../common/auth/hoc/requirePermissions';

function ClientUserDetailView(props) {
    const columns = [
        'title',
        'firstName',
        'lastName',
        'activatedAt',
        'email',
        'contactPhone',
        {
            label: 'Billing Account',
            dataIndex: 'accountToClient',
            key: 'accountToClient',
            render(record) {
                const accountLink = record.accountToClient.toJS().map(r => (
                    <div>
                        <ActionLink
                            key={r.account}
                            action="detail"
                            model={Account}
                            params={{ id: r.account }}
                        >
                            {r.accountName}
                        </ActionLink>
                    </div>
                ));
                return accountLink;
            },
        },
        'driverInstructions',
        'internalInstructions',
        'priority',
    ];
    return <DetailView fields={columns} {...props} />;
}

export default requirePermissions({ action: 'list', model: ClientUser })(ClientUserDetailView);
