/**
 * Given an array of columns - either a string name or an object with a 'dataIndex' key - extract
 * the list of column names. Will exclude any names specified in `excludeFieldNames`.
 *
 * Useful for taking list of columns for an ant table and generating names necessary to pass to
 * partialRecordFieldNames on a FetchListView
 * @param model {Model}
 * @param columns {Array}
 * @param excludeFieldNames {Array}
 * @returns {*}
 */
export function getColumnFieldNames(model, columns, excludeFieldNames = []) {
    return columns.reduce((names, col) => {
        const name = typeof col == 'string' ? col : col.dataIndex;
        if (name && !excludeFieldNames.includes(name) && model._meta.fields[name]) {
            names.push(name);
        }
        if (col.children) {
            names.push(...getColumnFieldNames(model, col.children, excludeFieldNames));
        }
        return names;
    }, []);
}

let hasWebpSupport = null;
export const checkWebpSupport = callback => {
    if (hasWebpSupport === null) {
        const kTestImages = {
            lossy: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        };

        const img = new Image();
        img.onload = () => {
            hasWebpSupport = img.width > 0 && img.height > 0;
            callback(hasWebpSupport);
        };

        img.onerror = function error() {
            hasWebpSupport = false;
            callback(false);
        };

        img.src = 'data:image/webp;base64,' + kTestImages.lossy;
    } else {
        callback(hasWebpSupport);
    }
};

// Function to take a string phone number and attempt to format it as: xxxx xxx xxx
export function formatPhoneNumber(phoneNumber) {
    // If isn't a valid type or if it is already formatted in some form with spaces
    // return back the number passed.
    if (!phoneNumber || typeof phoneNumber !== 'string' || /\s/.test(phoneNumber)) {
        return phoneNumber;
    }

    // Remove any non digits
    const cleanNonDigits = ('' + phoneNumber).replace(/\D/g, '');

    // Format in xxxx xxx xxx
    const match = cleanNonDigits.match(/^(\d{4})(\d{3})(\d{3})$/);
    if (match) {
        return `${match[1]} ${match[2]} ${match[3]}`;
    }

    // For whatever reason we get this far without a match, just return what was given.
    return phoneNumber;
}
