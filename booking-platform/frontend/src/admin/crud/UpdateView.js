import Breadcrumb from '@alliance-software/djrad/components/breadcrumbs/Breadcrumb';
import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import PropTypes from 'prop-types';
import React from 'react';

import requirePermissions from '../../common/auth/hoc/requirePermissions';
import AdminPageHeader from '../components/AdminPageHeader';
import ScbpModelForm from '../../common/data/ScbpModelForm';
import { defaultOnSuccess } from './handlers';

function defaultRenderForm(formProps) {
    return <ScbpModelForm {...formProps} fieldNames={formProps.record._meta.crud.updateFields} />;
}

/**
 * Render a generic update view for a model. If you need to customise this for a
 * specific model beyond what is possible with props here consider just copying this file
 * (eg. UserUpdateView) and passing that to ModelCrud:
 *
 *   <ModelCrud model={User} actionComponents={{ update: UserUpdateView }} />
 */
function UpdateView({
    match,
    record,
    renderForm,
    initialValues,
    onSuccess = defaultOnSuccess,
    prologue,
    epilogue,
    ...rest
}) {
    const { formProps } = useModelFormProcessor({
        ...rest,
        record,
        onSuccess,
    });

    return (
        <>
            <Breadcrumb to={match.url}>Update</Breadcrumb>
            <AdminPageHeader htmlTitle={record.getHtmlTitle()} header={record.getPageHeader()} />
            {prologue}
            {renderForm(formProps)}
            {epilogue}
        </>
    );
}

UpdateView.propTypes = {
    record: modelInstance().isRequired,
    renderForm: PropTypes.func,
    initialValues: PropTypes.object,
    prologue: PropTypes.node,
    epilogue: PropTypes.node,
    onSuccess: PropTypes.func,
};

UpdateView.defaultProps = {
    renderForm: defaultRenderForm,
};

export default requirePermissions({ action: 'update', recordProp: 'record' })(UpdateView);
