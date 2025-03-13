import React from 'react';
import PropTypes from 'prop-types';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import DetailGridView from '@alliance-software/djrad/components/model/DetailGridView';

import requirePermissions from '../../common/auth/hoc/requirePermissions';
import AdminPageHeader from '../components/AdminPageHeader';

function DetailView({ record, prologue, epilogue, fields }) {
    return (
        <>
            <AdminPageHeader htmlTitle={record.getHtmlTitle()} header={record.getPageHeader()} />
            {prologue}
            <DetailGridView fields={fields} record={record} />
            {epilogue}
        </>
    );
}

DetailView.propTypes = {
    record: modelInstance(),
    prologue: PropTypes.node,
    epilogue: PropTypes.node,
    fields: PropTypes.array,
};

export default requirePermissions({ action: 'detail', recordProp: 'record' })(DetailView);
