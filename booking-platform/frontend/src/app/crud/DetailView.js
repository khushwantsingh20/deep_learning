import React from 'react';
import PropTypes from 'prop-types';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import DetailGridView from '@alliance-software/djrad/components/model/DetailGridView';

import requirePermissions from '../../common/auth/hoc/requirePermissions';
import PageHeader from '../../common/layout/PageHeader';

function DetailView({ record, prologue, epilogue }) {
    return (
        <>
            <PageHeader htmlTitle={record.getHtmlTitle()} header={record.getPageHeader()} />
            {prologue}
            <DetailGridView record={record} />
            {epilogue}
        </>
    );
}

DetailView.propTypes = {
    record: modelInstance(),
    prologue: PropTypes.node,
    epilogue: PropTypes.node,
};

export default requirePermissions({ action: 'detail', recordProp: 'record' })(DetailView);
