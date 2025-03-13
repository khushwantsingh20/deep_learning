import ButtonLink from '@alliance-software/djrad/components/ButtonLink';
import React from 'react';
import PropTypes from 'prop-types';
import { message } from 'antd';
import { appendToUrl } from '@alliance-software/djrad/util/url';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import Breadcrumb from '@alliance-software/djrad/components/breadcrumbs/Breadcrumb';
import Fetch from '@alliance-software/djrad/components/data/Fetch';

import requirePermissions from '../../common/auth/hoc/requirePermissions';
import PageHeader from '../../common/layout/PageHeader';
import DeleteSummary from './DeleteSummary';

/**
 * Render a generic deletion view for a model. If you need to customise this for a
 * specific model beyond what is possible with props here consider just copying this file
 * (eg. UserDeleteView) and passing that to ModelCrud:
 *
 *   <ModelCrud model={User} actionComponents={{ delete: UserDeleteView }} />
 */
function DeleteView({ match, record, history, prologue, epilogue }) {
    return (
        <>
            <Breadcrumb to={match.url}>Delete</Breadcrumb>
            <PageHeader
                htmlTitle={`Delete ${record.getHtmlTitle()}`}
                header={`Delete ${record.getPageHeader()}`}
                buttons={
                    <ButtonLink
                        to={record.constructor.getActionUrl('detail', { id: record.getId() })}
                    >
                        Cancel
                    </ButtonLink>
                }
            />
            {prologue}
            <Fetch
                endpoint={appendToUrl(record._meta.endpoint, [record.getId(), 'delete_summary'])}
            >
                {({ isFetching, response, error }) => {
                    if (isFetching) {
                        return <p>Generating deletion summary...</p>;
                    }
                    if (error) {
                        return <p>There was a problem generating the deletion summary.</p>;
                    }
                    return (
                        <DeleteSummary
                            record={record}
                            summary={response}
                            onSuccess={() => {
                                history.replace(record.constructor.getActionUrl('list'));
                                message.success(
                                    `${record._meta.label} '${record.__str__}' deleted`
                                );
                            }}
                        />
                    );
                }}
            </Fetch>
            {epilogue}
        </>
    );
}

DeleteView.propTypes = {
    record: modelInstance(),
    prologue: PropTypes.node,
    epilogue: PropTypes.node,
};

export default requirePermissions({ action: 'delete', recordProp: 'record' })(DeleteView);
