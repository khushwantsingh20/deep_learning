import { Set } from 'immutable';
import { Map, Typed } from 'typed-immutable';

import createReducer from '@alliance-software/djrad/util/createReducer';

/**
 * Redux reducer for dispatch list form item open state
 * Structure is Map(bookingNumber -> Set(fieldName)), where
 * bookingNumber is the bookingNumber of the booking in question
 * and fieldName is the name of the field corresponding to the form
 * that is open
 * Structure is expected to be sparse - most frequent cases are zero or one open item
 */

export const OPEN_DISPATCH_FORM_ITEM = 'OPEN_DISPATCH_FORM_ITEM';
export const CLOSE_DISPATCH_FORM_ITEM = 'CLOSE_DISPATCH_FORM_ITEM';

const DispatchItemState = Map(Number, Typed.ImmutableClass(Set)(String));

export default createReducer(DispatchItemState, {
    [OPEN_DISPATCH_FORM_ITEM]: (state, action) => {
        const { fieldName, bookingNumber } = action.payload;
        // If the booking already has open fields, add this field to the booking's open fields
        // Otherwise, create the set and add only this field to that set
        return state.update(bookingNumber, oldValue =>
            oldValue ? oldValue.add(fieldName) : Set.of(fieldName)
        );
    },
    [CLOSE_DISPATCH_FORM_ITEM]: (state, action) => {
        const { fieldName, bookingNumber } = action.payload;
        // If the booking doesn't have this field open or doesn't have any fields open, close is a no-op
        if (!state.has(bookingNumber) || !state.get(bookingNumber).has(fieldName)) {
            return state;
        }
        // Remove reference to the booking if the field is the only open field for the booking
        if (
            state
                .get(bookingNumber)
                .filter(value => value !== fieldName)
                .isEmpty()
        ) {
            return state.remove(bookingNumber);
        }
        // Otherwise, remove the field from the set of open fields for the booking
        return state.update(bookingNumber, oldValue => oldValue.remove(fieldName));
    },
});
