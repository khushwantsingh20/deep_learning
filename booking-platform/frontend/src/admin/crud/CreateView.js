import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import React from 'react';
import PropTypes from 'prop-types';
import { modelClass } from '@alliance-software/djrad/prop-types/model';
import Breadcrumb from '@alliance-software/djrad/components/breadcrumbs/Breadcrumb';

import requirePermissions from '../../common/auth/hoc/requirePermissions';
import AdminPageHeader from '../components/AdminPageHeader';
import ScbpModelForm from '../../common/data/ScbpModelForm';
import { defaultOnSuccess } from './handlers';

function defaultRenderForm(formProps) {
    return <ScbpModelForm {...formProps} fieldNames={formProps.model._meta.crud.createFields} />;
}

/**
 * Render a generic creation view for a model. If you need to customise this for a
 * specific model beyond what is possible with props here consider just copying this file
 * (eg. UserCreateView) and passing that to ModelCrud:
 *
 *   <ModelCrud model={User} actionComponents={{ create: UserCreateView }} />
 */
function CreateView({
    match,
    model,
    renderForm,
    initialValues,
    prologue,
    epilogue,
    onSuccess = defaultOnSuccess,
    ...rest
}) {
    const { formProps } = useModelFormProcessor({
        ...rest,
        model,
        onSuccess,
    });
    if (!initialValues && rest.location.state && rest.location.state.initialValues) {
        initialValues = rest.location.state.initialValues;
    }
    return (
        <>
            <Breadcrumb to={match.url}>Create</Breadcrumb>
            <AdminPageHeader htmlTitle={model.getHtmlTitle()} header={model.getPageHeader()} />
            {prologue}
            {renderForm({ ...formProps, initialValues })}
            {epilogue}
        </>
    );
}

CreateView.propTypes = {
    model: modelClass().isRequired,
    renderForm: PropTypes.func,
    initialValues: PropTypes.object,
    prologue: PropTypes.node,
    epilogue: PropTypes.node,
    onSuccess: PropTypes.func,
};

CreateView.defaultProps = {
    renderForm: defaultRenderForm,
};

export default requirePermissions({ action: 'create', modelProp: 'model' })(CreateView);
