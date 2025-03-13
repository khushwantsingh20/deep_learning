import useRouter from '@alliance-software/djrad-devtools/hooks/useRouter';
import { SubmissionErrors } from '@alliance-software/djrad/components/form/Form';
import { FORM_ACTIONS } from '@alliance-software/djrad/components/form/FormButton';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { ActionUrlContext } from '@alliance-software/djrad/site/components/context';
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Form as ReduxForm } from 'redux-form';
import ModelForm from '@alliance-software/djrad/components/model/ModelForm'; // eslint-disable-line

export default function ScbpModelForm({
    submissionErrorsMessage = 'There was a problem with your submission',
    beforeErrorRender,
    ...props
}) {
    const extraProps = {};
    if (props.forceConnected && !props.wrapperComponent) {
        // If we are forcing a connect we need to make sure wrapperComponent is set
        // to redux form otherwise it will be a FormSection and will inherit the
        // name of the parent form
        extraProps.wrapperComponent = ReduxForm;
    }
    const renderErrors = errors => {
        beforeErrorRender && beforeErrorRender(errors);
        return (
            errors && (
                <ModelForm.Item fullWidth>
                    <SubmissionErrors errors={errors} message={submissionErrorsMessage} />
                </ModelForm.Item>
            )
        );
    };
    const { history } = useRouter();
    const { getActionUrl } = useContext(ActionUrlContext);

    // This handles clicking a 'DELETE' button within the form - we just redirect to the
    // delete model page. This is part of the default ModelFormButtonBar.
    const handleFormAction = action => {
        if (props.record && action === FORM_ACTIONS.DELETE) {
            const model = props.record.constructor;
            const url = getActionUrl(model, 'delete', { id: props.record.getId() });
            history.push(url);
        }
    };
    return (
        <ModelForm
            {...extraProps}
            layout="horizontal"
            defaultLabelCol={{ sm: { span: 6 }, xl: { span: 6 } }}
            defaultWrapperCol={{ sm: { span: 18 }, xl: { span: 16 } }}
            renderErrors={renderErrors}
            onFormAction={handleFormAction}
            {...props}
        />
    );
}

ScbpModelForm.Item = ModelForm.Item;
ScbpModelForm.Field = ModelForm.Field;
ScbpModelForm.Widget = ModelForm.Widget;
ScbpModelForm.Button = ModelForm.Button;

ScbpModelForm.propTypes = {
    record: modelInstance(),
    forceConnected: PropTypes.bool,
    wrapperComponent: PropTypes.object,
    /**
     * message prop passed to ant Alert when an unhandled or non-field specific error occurs
     */
    submissionErrorsMessage: PropTypes.string,
    /**
     * Custom error renderer for those times when the default just won't do
     */
    beforeErrorRender: PropTypes.func,
};
