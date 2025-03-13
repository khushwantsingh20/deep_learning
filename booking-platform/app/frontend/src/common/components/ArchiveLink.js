import React from 'react';
import PropTypes from 'prop-types';
import { modelDetailRoute } from '@alliance-software/djrad/actions';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { Button, Popconfirm } from 'antd';
import { Link } from 'react-router-dom';

function ArchiveLinkLink({ action, record }) {
    const endpoint = action === 'archive' ? 'archive' : 'unarchive';
    const { run, isLoading } = useAsyncRedux(() => modelDetailRoute('post', record, endpoint));

    if (action === 'archive') {
        return (
            <Popconfirm
                title="Are you sure you want to archive this?"
                onConfirm={run}
                okText="Yes"
                cancelText="No"
            >
                <Button loading={isLoading} type="link">
                    Archive
                </Button>
            </Popconfirm>
        );
    }

    return (
        <Button loading={isLoading} onClick={run} type="link">
            {action === 'archive' ? 'Archive' : 'Unarchive'}
        </Button>
    );
}

ArchiveLinkLink.propTypes = {
    action: PropTypes.string.isRequired,
    record: modelInstance().isRequired,
};

export default function ArchiveLink(props) {
    if (['archive', 'unarchive'].includes(props.action)) {
        return <ArchiveLinkLink {...props} />;
    }
    return <Link {...props} />;
}

ArchiveLink.propTypes = {
    action: PropTypes.string.isRequired,
    record: modelInstance().isRequired,
};
