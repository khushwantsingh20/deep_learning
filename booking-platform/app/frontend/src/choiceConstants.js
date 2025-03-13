const { choiceConstants } = window.__APP_CONTEXT__;

class EnumValue {
    label = null;
    value = null;
    name = null;
    constructor(typeMap, type) {
        const choice = typeMap.get(type);
        this.label = choice.label;
        this.value = choice.value;
        this.name = choice.name;
    }
}

function validate(name, type, typeMap) {
    const keys = Object.keys(type);
    const l = keys.length;
    if (typeMap.size !== l) {
        const missingKeys = [...typeMap.keys()].filter(key => !keys.includes(key)).join(', ');
        throw new Error(
            `Expected ${l} priorities, got ${typeMap.size}. Check definition for ${name} in choiceConstants.js - missing definition(s) for ${missingKeys}.`
        );
    }
    for (const key of typeMap.keys()) {
        if (!type[key]) {
            throw new Error(`Unknown ${name} constant ${key}.`);
        }
    }
}

/**
 * Generates something like
 *
 * HOME => 'Home'
 * AIRPORT => 'Airport'
 */
function buildTypeMap(type) {
    return new Map(
        type.reduce((acc, choice) => {
            acc.push([choice.name, choice]);
            return acc;
        }, [])
    );
}

/**
 * Generates choices as expected by ChoiceWidget
 *
 * 0 => 'Home',
 * 1 => 'Choices',
 */
function buildChoices(type, filter = () => true) {
    return type.reduce((acc, choice) => {
        if (!filter(choice)) {
            return acc;
        }
        acc.push([choice.value, choice.label]);
        return acc;
    }, []);
}

// Explicitly enumerating types here to make autocomplete better & if new types are
// added we need to explicitly add support for them anyway

const addressTypeMap = buildTypeMap(choiceConstants.BookingAddressType);
export const BookingAddressType = {
    AIRPORT: new EnumValue(addressTypeMap, 'AIRPORT'),
    HOME: new EnumValue(addressTypeMap, 'HOME'),
    OFFICE: new EnumValue(addressTypeMap, 'OFFICE'),
    ADDRESS_BOOK: new EnumValue(addressTypeMap, 'ADDRESS_BOOK'),
    CUSTOM: new EnumValue(addressTypeMap, 'CUSTOM'),
};
export const bookingAddressTypeChoices = buildChoices(choiceConstants.BookingAddressType);
validate('BookingAddressType', BookingAddressType, addressTypeMap);

const bookingTypeMap = buildTypeMap(choiceConstants.BookingType);
export const BookingType = {
    ONE_WAY: new EnumValue(bookingTypeMap, 'ONE_WAY'),
    HOURLY: new EnumValue(bookingTypeMap, 'HOURLY'),
};
export const bookingTypeChoices = buildChoices(choiceConstants.BookingType);
validate('BookingType', BookingType, bookingTypeMap);

const clientAddressTypeMap = buildTypeMap(choiceConstants.ClientAddressType);
export const ClientAddressType = {
    HOME: new EnumValue(clientAddressTypeMap, 'HOME'),
    OFFICE: new EnumValue(clientAddressTypeMap, 'OFFICE'),
    OTHER: new EnumValue(clientAddressTypeMap, 'OTHER'),
};
export const clientAddressTypeChoices = buildChoices(choiceConstants.ClientAddressType);
validate('ClientAddressType', ClientAddressType, clientAddressTypeMap);

const userTypeMap = buildTypeMap(choiceConstants.UserType);
export const UserType = {
    STAFF_MANAGER: new EnumValue(userTypeMap, 'STAFF_MANAGER'),
    STAFF_SUPERVISOR: new EnumValue(userTypeMap, 'STAFF_SUPERVISOR'),
    STAFF_TELEPHONIST: new EnumValue(userTypeMap, 'STAFF_TELEPHONIST'),
    CLIENT: new EnumValue(userTypeMap, 'CLIENT'),
    DRIVER: new EnumValue(userTypeMap, 'DRIVER'),
};
export const userTypeChoices = buildChoices(choiceConstants.UserType);
export const staffUserTypeChoices = buildChoices(choiceConstants.UserType, choice =>
    choice.name.startsWith('STAFF_')
);
validate('UserType', UserType, userTypeMap);

const paymentTermsTypeMap = buildTypeMap(choiceConstants.AccountPaymentTermsType);
export const PaymentTermsType = {
    COD: new EnumValue(paymentTermsTypeMap, 'COD'),
    THIRTY_DAYS: new EnumValue(paymentTermsTypeMap, 'THIRTY_DAYS'),
};
export const paymentTermsTypeChoices = buildChoices(choiceConstants.AccountPaymentTermsType);
validate('PaymentTermsType', PaymentTermsType, paymentTermsTypeMap);

const paymentMethodTypeMap = buildTypeMap(choiceConstants.AccountPaymentMethodType);
export const PaymentMethodType = {
    INVOICE: new EnumValue(paymentMethodTypeMap, 'INVOICE'),
    CREDIT_CARD: new EnumValue(paymentMethodTypeMap, 'CREDIT_CARD'),
    DRIVER_COLLECT: new EnumValue(paymentMethodTypeMap, 'DRIVER_COLLECT'),
};
export const paymentMethodTypeChoices = buildChoices(choiceConstants.AccountPaymentMethodType);
validate('PaymentMethodType', PaymentMethodType, paymentMethodTypeMap);

const accountDriverCollectMethodMap = buildTypeMap(choiceConstants.AccountDriverCollectMethod);
export const AccountDriverCollectMethod = {
    NONE: new EnumValue(accountDriverCollectMethodMap, 'NONE'),
    CABCHARGE: new EnumValue(accountDriverCollectMethodMap, 'CABCHARGE'),
    CAB_CARD: new EnumValue(accountDriverCollectMethodMap, 'CAB_CARD'),
    CAB_CASH: new EnumValue(accountDriverCollectMethodMap, 'CAB_CASH'),
};
validate('AccountDriverCollectMethod', AccountDriverCollectMethod, accountDriverCollectMethodMap);
export const accountDriverCollectMethodChoices = [
    [AccountDriverCollectMethod.CABCHARGE.value, 'Cab Charge'],
    [AccountDriverCollectMethod.CAB_CARD.value, 'Credit Card'],
    [AccountDriverCollectMethod.CAB_CASH.value, 'Cash'],
];

const categoryTypeMap = buildTypeMap(choiceConstants.AccountCategoryType);
export const CategoryType = {
    PERSONAL: new EnumValue(categoryTypeMap, 'PERSONAL'),
    BUSINESS: new EnumValue(categoryTypeMap, 'BUSINESS'),
};
validate('CategoryType', CategoryType, categoryTypeMap);

const bookingStatusMap = buildTypeMap(choiceConstants.BookingStatus);
export const BookingStatus = {
    UNVERIFIED: new EnumValue(bookingStatusMap, 'UNVERIFIED'),
    VERIFIED: new EnumValue(bookingStatusMap, 'VERIFIED'),
    OFFERED: new EnumValue(bookingStatusMap, 'OFFERED'),
    KNOCKED_BACK: new EnumValue(bookingStatusMap, 'KNOCKED_BACK'),
    CHANGED: new EnumValue(bookingStatusMap, 'CHANGED'),
    CONFIRMED: new EnumValue(bookingStatusMap, 'CONFIRMED'),
    PICKED_UP: new EnumValue(bookingStatusMap, 'PICKED_UP'),
    CLEARED: new EnumValue(bookingStatusMap, 'CLEARED'),
    VARIATION: new EnumValue(bookingStatusMap, 'VARIATION'),
    COMPLETED: new EnumValue(bookingStatusMap, 'COMPLETED'),
    CANCELLED: new EnumValue(bookingStatusMap, 'CANCELLED'),
};
export const bookingStatusChoices = buildChoices(choiceConstants.BookingStatus);
validate('BookingStatus', BookingStatus, bookingStatusMap);

const rateScheduleTypeMap = buildTypeMap(choiceConstants.RateScheduleType);
export const RateScheduleType = {
    STANDARD: new EnumValue(rateScheduleTypeMap, 'STANDARD'),
    RETAIL: new EnumValue(rateScheduleTypeMap, 'RETAIL'),
    CORPORATE: new EnumValue(rateScheduleTypeMap, 'CORPORATE'),
    INSTITUTION: new EnumValue(rateScheduleTypeMap, 'INSTITUTION'),
};
export const rateScheduleTypeChoices = buildChoices(choiceConstants.RateScheduleType);
validate('RateScheduleType', RateScheduleType, rateScheduleTypeMap);

const invoicingMethodTypeMap = buildTypeMap(choiceConstants.AccountInvoicingMethodType);
export const InvoicingMethodType = {
    EMAIL: new EnumValue(invoicingMethodTypeMap, 'EMAIL'),
    SMS: new EnumValue(invoicingMethodTypeMap, 'SMS'),
    MAIL: new EnumValue(invoicingMethodTypeMap, 'MAIL'),
};
export const invoicingMethodTypeChoices = buildChoices(choiceConstants.AccountInvoicingMethodType);
validate('InvoicingMethodType', InvoicingMethodType, invoicingMethodTypeMap);

const priceVariationTypeMap = buildTypeMap(choiceConstants.PriceVariationType);
export const PriceVariationType = {
    WAITING: new EnumValue(priceVariationTypeMap, 'WAITING'),
    ADHOC: new EnumValue(priceVariationTypeMap, 'ADHOC'),
    DISCOUNT: new EnumValue(priceVariationTypeMap, 'DISCOUNT'),
    OUT_OF_AREA: new EnumValue(priceVariationTypeMap, 'OUT_OF_AREA'),
    INTERSTATE_TRANSFER_RATE: new EnumValue(priceVariationTypeMap, 'INTERSTATE_TRANSFER_RATE'),
    OTHER: new EnumValue(priceVariationTypeMap, 'OTHER'),
};
export const priceVariationTypeChoices = buildChoices(choiceConstants.PriceVariationType);
validate('PriceVariationType', PriceVariationType, priceVariationTypeMap);

const bookingMethodMap = buildTypeMap(choiceConstants.BookingMethod);
export const BookingMethod = {
    PHONE: new EnumValue(bookingMethodMap, 'PHONE'),
    EMAIL: new EnumValue(bookingMethodMap, 'EMAIL'),
    SMS: new EnumValue(bookingMethodMap, 'SMS'),
    WEBSITE: new EnumValue(bookingMethodMap, 'WEBSITE'),
    APP: new EnumValue(bookingMethodMap, 'APP'),
};
export const bookingMethodChoices = buildChoices(choiceConstants.BookingMethod);
validate('BookingMethod', BookingMethod, bookingMethodMap);

const bookingPaymentMethodMap = buildTypeMap(choiceConstants.BookingPaymentMethod);
export const BookingPaymentMethod = {
    INVOICE: new EnumValue(bookingPaymentMethodMap, 'INVOICE'),
    CREDIT_CARD: new EnumValue(bookingPaymentMethodMap, 'CREDIT_CARD'),
    DRIVER_COLLECT: new EnumValue(bookingPaymentMethodMap, 'DRIVER_COLLECT'),
};

validate('BookingPaymentMethod', BookingPaymentMethod, bookingPaymentMethodMap);

const bookingDriverCollectMethodMap = buildTypeMap(choiceConstants.BookingDriverCollectMethod);
export const BookingDriverCollectMethod = {
    NONE: new EnumValue(bookingDriverCollectMethodMap, 'NONE'),
    CABCHARGE: new EnumValue(bookingDriverCollectMethodMap, 'CABCHARGE'),
    CAB_CARD: new EnumValue(bookingDriverCollectMethodMap, 'CAB_CARD'),
    CAB_CASH: new EnumValue(bookingDriverCollectMethodMap, 'CAB_CASH'),
};
validate('BookingDriverCollectMethod', BookingDriverCollectMethod, bookingDriverCollectMethodMap);
export const bookingDriverCollectMethodChoices = [
    [BookingDriverCollectMethod.CABCHARGE.value, 'Cab Charge'],
    [BookingDriverCollectMethod.CAB_CARD.value, 'Credit Card'],
    [BookingDriverCollectMethod.CAB_CASH.value, 'Cash'],
];

const airportTerminalMap = buildTypeMap(choiceConstants.AirportTerminal);
export const AirportTerminal = {
    T1: new EnumValue(airportTerminalMap, 'T1'),
    T2: new EnumValue(airportTerminalMap, 'T2'),
    T3: new EnumValue(airportTerminalMap, 'T3'),
    T4: new EnumValue(airportTerminalMap, 'T4'),
};
export const AirportTerminalValueMap = Object.values(AirportTerminal).reduce((result, item) => {
    result[item.value] = item;
    return result;
}, {});
export const airportTerminalChoices = buildChoices(choiceConstants.AirportTerminal);
validate('AirportTerminal', AirportTerminal, airportTerminalMap);

const clientUserPriorityMap = buildTypeMap(choiceConstants.ClientUserPriority);
export const ClientUserPriority = {
    HIGH: new EnumValue(clientUserPriorityMap, 'HIGH'),
    MID: new EnumValue(clientUserPriorityMap, 'MID'),
    LOW: new EnumValue(clientUserPriorityMap, 'LOW'),
};
validate('ClientUserPriority', ClientUserPriority, clientUserPriorityMap);

const paymentStatusMap = buildTypeMap(choiceConstants.PaymentStatus);
export const PaymentStatus = {
    SUCCESS: new EnumValue(paymentStatusMap, 'SUCCESS'),
    FAILURE: new EnumValue(paymentStatusMap, 'FAILURE'),
    PENDING: new EnumValue(paymentStatusMap, 'PENDING'),
};
validate('PaymentStatus', PaymentStatus, paymentStatusMap);
// ADD NEW TYPES HERE
