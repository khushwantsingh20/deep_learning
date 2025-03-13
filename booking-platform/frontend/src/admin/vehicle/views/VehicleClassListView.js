import PropTypes from 'prop-types';
import { modelDetailRoute } from '@alliance-software/djrad/actions';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { Button } from 'antd';
import React from 'react';
import ActionLinkList from '@alliance-software/djrad/components/model/ActionLinkList';
import { Link } from 'react-router-dom';
import ListView from '../../crud/ListView';

import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import { VehicleClass } from '../models';

function ReorderLink({ action, record }) {
    const endpoint = action === 'moveUp' ? 'move-up' : 'move-down';
    const { run, isLoading } = useAsyncRedux(() => modelDetailRoute('post', record, endpoint));
    return (
        <Button
            loading={isLoading}
            onClick={run}
            icon={action === 'moveUp' ? 'arrow-up' : 'arrow-down'}
            type="link"
        />
    );
}

ReorderLink.propTypes = {
    action: PropTypes.string.isRequired,
    record: modelInstance('scbp_core.vehicleclass').isRequired,
};

function VehicleClassLinkComponent(props) {
    if (['moveUp', 'moveDown'].includes(props.action)) {
        return <ReorderLink {...props} />;
    }
    return <Link {...props} />;
}

VehicleClassLinkComponent.propTypes = {
    action: PropTypes.string.isRequired,
    record: modelInstance('scbp_core.vehicleclass').isRequired,
};

function VehicleClassListView(props) {
    const columns = [
        'title',
        {
            dataIndex: 'actions',
            render(value, record) {
                return (
                    <ActionLinkList
                        record={record}
                        actions={['detail', 'update', 'delete', 'moveUp', 'moveDown']}
                        linkComponent={VehicleClassLinkComponent}
                        linkProps={{ record }}
                    />
                );
            },
        },
    ];

    return <ListView {...props} columns={columns} />;
}

export default requirePermissions({ action: 'list', model: VehicleClass })(VehicleClassListView);
