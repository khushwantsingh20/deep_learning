import PropTypes from 'prop-types';
import FormField from '@alliance-software/djrad/components/form/FormField';
import ListItemWidget from '@alliance-software/djrad/components/form/widgets/ListItemWidget';
import ListWidget from '@alliance-software/djrad/components/form/widgets/ListWidget';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import { Button, Icon, Modal } from 'antd';
import React from 'react';
import { FieldArray } from 'redux-form';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import PriceVariationWidget from '../../../common/form/PriceVariationWidget';
import { ReactComponent as RemoveIcon } from '../../../images/icon-circle-cross-filled.svg';
import { Booking } from '../models';
import styles from './VariationOutOfPocketEntryModal.less';

const { Item, Field } = ScbpModelForm;

const renderRemoveButton = ({ onRemove, canRemove }) =>
    canRemove && (
        <Button type="link" onClick={onRemove} className={styles.removeButton}>
            <RemoveIcon />
        </Button>
    );

export default function VariationOutOfPocketEntryModal({
    visible,
    onCancel,
    onSubmit,
    isOutOfPocket,
    initialValues,
    validate,
}) {
    const formName = isOutOfPocket ? 'oopModal' : 'variationModal';
    const formActions = useFormActions(formName);
    return (
        <Modal
            visible={visible}
            onCancel={onCancel}
            onOk={() => {
                return formActions.submit();
            }}
            title={isOutOfPocket ? 'Out of Pocket' : 'Variation'}
        >
            <ScbpModelForm
                className={styles.form}
                enableReinitialize
                forceConnected
                formName={formName}
                footer={null}
                onSubmit={onSubmit}
                model={Booking}
                initialValues={initialValues}
                validate={validate}
            >
                <Item fullWidth>
                    <Field
                        reduxFormFieldComponent={FieldArray}
                        name={isOutOfPocket ? 'outOfPockets' : 'priceVariations'}
                        widget={
                            <ListWidget
                                min={0}
                                renderItem={(fieldName, pps) => (
                                    <FormField
                                        name={fieldName}
                                        widget={
                                            <ListItemWidget
                                                {...pps}
                                                isOutOfPocket={isOutOfPocket}
                                                wrapperClassName={styles.priceVariationItem}
                                                prefix={`${pps.index + 1}.`}
                                                renderButton={renderRemoveButton}
                                                formName={formName}
                                            />
                                        }
                                    />
                                )}
                                inputWidget={PriceVariationWidget}
                                renderAddNewButton={({ onAdd, canAdd }) =>
                                    canAdd && (
                                        <Button type="link" size="small" onClick={onAdd}>
                                            <Icon type="plus" /> Add another{' '}
                                            {isOutOfPocket ? 'out of pocket expense' : 'variation'}
                                        </Button>
                                    )
                                }
                            />
                        }
                    />
                </Item>
            </ScbpModelForm>
        </Modal>
    );
}

VariationOutOfPocketEntryModal.propTypes = {
    visible: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    isOutOfPocket: PropTypes.bool,
    initialValues: PropTypes.object,
    validate: PropTypes.func,
};
