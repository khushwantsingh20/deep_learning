import NumberWidget from '@alliance-software/djrad/components/form/widgets/NumberWidget';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import React from 'react';
import PropTypes from 'prop-types';
import InputWidget from '@alliance-software/djrad/components/form/widgets/InputWidget';
import ChoicesWidget from '@alliance-software/djrad/components/form/widgets/ChoicesWidget';
import { PriceVariationType, priceVariationTypeChoices } from '../../choiceConstants';
import ScbpModelForm from '../data/ScbpModelForm';

import styles from './PriceVariationWidget.less';

/**
 * Widget for variations used within ListWidget
 *
 * This contains multiple fields - the `description` (if isOutOfPocket) or variationType (not isOutOfPocket)
 * and the `amount` field. This uses the redux-form dot syntax, eg. priceVariations[1].amount for the amount
 * field on the second price variation in the list.
 * @param isOutOfPocket True if this is out of pocket expense otherwise it's a price variation
 * @param prefix Prefix to render before field
 * @param name Name of the field - this is eg. priceVariations[1]
 */
export default function PriceVariationWidget({ isOutOfPocket, prefix, name, formName }) {
    const variationTypeFieldName = `${name}.variationType`;
    const { [variationTypeFieldName]: variationType } = useFormValues(formName, [
        variationTypeFieldName,
    ]);
    return (
        <div className={styles.wrapper}>
            <div className={styles.prefix}>{prefix}</div>
            <ScbpModelForm.Item className={styles.type} fullWidth>
                {isOutOfPocket ? (
                    <ScbpModelForm.Field
                        isUserDefinedField
                        name={`${name}.description`}
                        widget={<InputWidget autoFocus className={styles.oopInput} />}
                    />
                ) : (
                    <ScbpModelForm.Field
                        isUserDefinedField
                        name={`${name}.variationType`}
                        widget={<ChoicesWidget autoFocus choices={priceVariationTypeChoices} />}
                    />
                )}
                {!isOutOfPocket && Number(variationType) === PriceVariationType.OTHER.value && (
                    <ScbpModelForm.Field
                        isUserDefinedField
                        name={`${name}variationTypeOtherDescription`}
                        widget={
                            <InputWidget
                                autoFocus
                                className={styles.oopInput}
                                placeholder="Description of variation"
                            />
                        }
                    />
                )}
            </ScbpModelForm.Item>
            <ScbpModelForm.Item fullWidth>
                <ScbpModelForm.Field
                    isUserDefinedField
                    name={`${name}.amount`}
                    className={styles.amount}
                    widget={NumberWidget}
                />
            </ScbpModelForm.Item>
        </div>
    );
}

PriceVariationWidget.propTypes = {
    name: PropTypes.string.isRequired,
    prefix: PropTypes.string,
    isOutOfPocket: PropTypes.bool,
    formName: PropTypes.string.isRequired,
};
