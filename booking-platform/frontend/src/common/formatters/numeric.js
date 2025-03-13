export function formatAuCurrency(value, decimalPlaces = 2, maxDecimalPlaces = decimalPlaces) {
    const locales = ['au'];
    const localeOptions = {
        currency: 'AUD',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: maxDecimalPlaces,
    };
    let finalValue = value;
    if (typeof value !== 'number') {
        finalValue = Number(value);
    }
    if (isNaN(finalValue)) {
        return '';
    }
    let prefix = '';
    if (finalValue < 0) {
        finalValue = Math.abs(finalValue);
        prefix = '-';
    }
    return `${prefix}$${finalValue.toLocaleString(locales, localeOptions)}`;
}

export function formatPercentage(value) {
    return `${Number(value).toFixed(2)}%`;
}
