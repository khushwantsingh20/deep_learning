import InputWidget from '@alliance-software/djrad/components/form/widgets/InputWidget';
import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';

import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { useFormItemKeyboardNavigation } from '../hooks/useFieldKeyboardNavigation';

import styles from '../dispatch.less';

export default function DispatchListFormItem({
    fieldName,
    record,
    transformValue,
    value,
    getFunctionForKey,
    openItem,
    closeItem,
    narrow,
}) {
    const {
        isOpen,
        formName,
        errors,
        onNonEditingClick,
        onSaveEdit,
        handleKeyPress,
        handleFocus,
        handleBlur,
    } = useFormItemKeyboardNavigation(
        fieldName,
        record,
        transformValue,
        getFunctionForKey,
        openItem,
        closeItem
    );

    if (!isOpen) {
        return (
            <div
                className={cx(styles.dispatchFormFieldToggle, {
                    [styles.dispatchFormFieldNarrow]: narrow,
                })}
                id={`${fieldName}_${record.bookingNumber}_closed`}
                onClick={onNonEditingClick}
            >
                <span className={styles.dispatchFormFieldValue}>{value}</span>
            </div>
        );
    }
    return (
        <ScbpModelForm name={formName} record={record} footer={null} onSubmit={onSaveEdit}>
            <ScbpModelForm.Item errors={errors.current} fullWidth name={fieldName} label={false}>
                <ScbpModelForm.Field
                    autoComplete="off"
                    autoFocus
                    id={`${fieldName}_${record.bookingNumber}_open`}
                    name={fieldName}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyPress}
                    onBlur={handleBlur}
                    widget={InputWidget}
                    widgetProps={{ className: cx({ [styles.dispatchFormFieldNarrow]: narrow }) }}
                />
            </ScbpModelForm.Item>
        </ScbpModelForm>
    );
}

DispatchListFormItem.propTypes = {
    fieldName: PropTypes.string.isRequired,
    record: PropTypes.object.isRequired,
    transformValue: PropTypes.func,
    value: PropTypes.any,
    getFunctionForKey: PropTypes.func,
    openItem: PropTypes.func.isRequired,
    closeItem: PropTypes.func.isRequired,
    narrow: PropTypes.bool,
};

DispatchListFormItem.defaultProps = {
    transformValue: value => value,
};
