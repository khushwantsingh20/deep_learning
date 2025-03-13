import { FORM_ACTIONS } from '@alliance-software/djrad/components/form/FormButton';
import { message } from 'antd';

export function defaultOnSuccess(
    response,
    { submitAction, history, originalRecord, model, formActions, getActionUrl, showMessage = true }
) {
    if (showMessage) {
        message.success(
            !originalRecord ? 'Record created successfully' : 'Record updated successfully'
        );
    }
    switch (submitAction) {
        case FORM_ACTIONS.SAVE_AND_CONTINUE: {
            if (!originalRecord) {
                const url = getActionUrl(model, 'update', { id: response.record.getId() });
                history.push(url);
            } else {
                formActions.initialize(response.record.toJS(), false, {});
            }
            break;
        }
        case FORM_ACTIONS.SAVE_AND_ADD_ANOTHER: {
            formActions.reset();
            const url = getActionUrl(model, 'create');
            history.push(url);
            break;
        }
        default: {
            const validActions = model._meta.getValidLinkActions({ recordOnly: true });
            if (validActions.length) {
                const urlParams = { id: response.record.getId() };
                if (validActions.includes('detail')) {
                    history.push(getActionUrl(model, 'detail', urlParams));
                } else {
                    history.push(getActionUrl(model, validActions[0], urlParams));
                }
            }
        }
    }
}
