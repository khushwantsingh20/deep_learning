import { CLOSE_DISPATCH_FORM_ITEM, OPEN_DISPATCH_FORM_ITEM } from './reducer';

/**
 * Open an item on the dispatch screen
 */
export function openItem({ bookingNumber, fieldName }) {
    return { type: OPEN_DISPATCH_FORM_ITEM, payload: { bookingNumber, fieldName } };
}

/**
 * Close an item on the dispatch screen
 */
export function closeItem({ bookingNumber, fieldName }) {
    return { type: CLOSE_DISPATCH_FORM_ITEM, payload: { bookingNumber, fieldName } };
}
