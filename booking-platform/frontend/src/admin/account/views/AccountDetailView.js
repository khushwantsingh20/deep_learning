import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import React from 'react';
import { PropTypes } from 'prop-types';
import DetailView from '../../../admin/crud/DetailView';
import { ClientUser } from '../../../admin/user/models';
import requirePermissions from '../../../common/auth/hoc/requirePermissions';

function AccountDetailView(props) {
    const fields = props.record._meta.crud.detailFields;
    const accountToClient = fields.indexOf('accountToClient');

    if (accountToClient !== -1) {
        fields[accountToClient] = {
            label: 'Linked clients',
            dataIndex: 'accountToClient',
            key: 'accountToClient',
            render(record) {
                const accountLink = record.accountToClient.toJS().map(r => (
                    <div>
                        <ActionLink
                            key={r.clientUser}
                            action="detail"
                            model={ClientUser}
                            params={{ id: r.clientUser }}
                        >
                            {r.clientName}
                        </ActionLink>
                    </div>
                ));
                return accountLink;
            },
        };
    }

    return <DetailView fields={fields} {...props} />;
}

export default requirePermissions({ action: 'list', model: ClientUser })(AccountDetailView);

AccountDetailView.propTypes = {
    record: PropTypes.array,
};
