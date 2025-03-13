import FieldFactory from '@alliance-software/djrad/model/factory/FieldFactory';
import AddressField from '../common/fields/AddressField';
import CreditCardField from '../common/fields/CreditCardField';
import DurationField from '../common/fields/DurationField';
import TimeField from '../common/fields/TimeField';

// Add any custom field types or field overrides here. This should be a mapping from the descriptor class
// on the backend (without the Descriptor suffix, eg. CurrencyValueFieldDescriptor => CurrencyValueField)
// to the Field class to use.
const customFieldTypeMap = {
    AddressField,
    TimeField,
    CreditCardField,
    DurationField,
};

export default class ScbpFieldFactory extends FieldFactory {
    getFieldClass(fieldClassName) {
        return customFieldTypeMap[fieldClassName] || super.getFieldClass(fieldClassName);
    }
}
