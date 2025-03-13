import { updateModel } from '@alliance-software/djrad/actions';
import { Button, message } from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as actions from '../actions';

const setFocus = ({ fieldName, bookingNumber }) => {
    const element = document.getElementById(`${fieldName}_${bookingNumber}_open`);
    if (element) {
        element.focus();
    }
};

export default function useFieldKeyboardNavigation(
    records,
    editableRowFields,
    setSendToDriverVisible,
    selectRecordId
) {
    /**
     * Field selection support
     *
     * This hook is used to manage navigation between fields in the dispatch view.  The hook is made aware of the
     * currently-visible records on the screen along with which fields should support adjacent navigation.
     *
     * Calling selectPrevious/selectNext shall move the focus to the equivalent field in the record above/below the
     * currently-selected record (except at the very top/bottom).
     *
     * Calling selectAdjacentPrevious, selectAdjacentNext shall move the focus to the previous or next field within the
     * current record.
     *
     * Dispatching to the relevant "select" method is now wrapped up within this function - callers just pass on the
     * keypress that was provided and the hook decides which select method to call.  See `getFunctionForKey`.
     */
    const dispatch = useDispatch();
    const openItem = useCallback(
        itemRef => {
            dispatch(actions.openItem(itemRef));
        },
        [dispatch]
    );
    const closeItem = useCallback(
        itemRef => {
            dispatch(actions.closeItem(itemRef));
        },
        [dispatch]
    );

    const previousRecords = useMemo(
        () =>
            records
                ? Object.fromEntries(
                      records.map((value, index) => {
                          if (index > 0) {
                              return [value.bookingNumber, records.get(index - 1).bookingNumber];
                          }
                          return [value.bookingNumber, value.bookingNumber];
                      })
                  )
                : [],
        [records]
    );
    const nextRecords = useMemo(
        () =>
            records
                ? Object.fromEntries(
                      records.map((value, index) => {
                          if (index < records.size - 1) {
                              return [value.bookingNumber, records.get(index + 1).bookingNumber];
                          }
                          return [value.bookingNumber, value.bookingNumber];
                      })
                  )
                : [],
        [records]
    );
    const changeField = useCallback(
        newItemRef => {
            openItem(newItemRef);
            setFocus(newItemRef);
        },
        [openItem]
    );
    const selectPrevious = useCallback(
        ({ fieldName, bookingNumber }) => {
            changeField({
                fieldName,
                bookingNumber: previousRecords[bookingNumber],
            });
        },
        [changeField, previousRecords]
    );
    const selectNext = useCallback(
        ({ fieldName, bookingNumber }) => {
            changeField({
                fieldName,
                bookingNumber: nextRecords[bookingNumber],
            });
        },
        [nextRecords, changeField]
    );

    const selectAdjacentPrevious = useCallback(
        ({ fieldName, bookingNumber }) => {
            if (editableRowFields.indexOf(fieldName) !== 0) {
                changeField({
                    fieldName: editableRowFields[editableRowFields.indexOf(fieldName) - 1],
                    bookingNumber,
                });
            }
        },
        [editableRowFields, changeField]
    );

    const selectAdjacentNext = useCallback(
        ({ fieldName, bookingNumber }) => {
            if (editableRowFields.indexOf(fieldName) !== editableRowFields.length - 1) {
                changeField({
                    fieldName: editableRowFields[editableRowFields.indexOf(fieldName) + 1],
                    bookingNumber,
                });
            }
        },
        [editableRowFields, changeField]
    );

    const openSendJobToDriverModal = useCallback(
        ({ fieldName }) => {
            if (fieldName === 'driverNumber') {
                setSendToDriverVisible(true);
            }
        },
        [setSendToDriverVisible]
    );

    const selectCurrentBooking = useCallback(
        ({ bookingNumber }) => {
            const currentRecord = records.find(record => record.bookingNumber === bookingNumber);
            if (currentRecord) {
                selectRecordId(currentRecord.id);
            }
        },
        [records, selectRecordId]
    );

    const getFunctionForKey = event => {
        if (event.ctrlKey && event.key.toLowerCase() === 'e') {
            return selectCurrentBooking;
        }

        if (event.key === 'ArrowDown') {
            return selectNext;
        }

        if (event.key === 'ArrowUp') {
            return selectPrevious;
        }

        if (event.key === 'ArrowLeft') {
            return selectAdjacentPrevious;
        }

        if (event.key === 'ArrowRight') {
            return selectAdjacentNext;
        }

        if (event.key === 'Enter') {
            return openSendJobToDriverModal;
        }

        return null;
    };

    return {
        getFunctionForKey,
        openItem,
        closeItem,
    };
}

export function useFormItemKeyboardNavigation(
    fieldName,
    record,
    transformValue,
    getFunctionForKey,
    openItem,
    closeItem
) {
    /**
     * Keyboard navigation support - individual form items
     *
     * Each `DispatchListFormItem` will use this hook to manage keyboard (onKeyPress) & mouse (onClick/onBlur) events.
     *
     * Takes care of saving edits when the field is moved away from (keyboard) or loses focus (mouse) including handling
     * failures to save & optionally re-focusing the field when this occurs.
     *
     * When using the mouse, the previously-active field will receive an onBlur event - if `isSaved` is false then a
     * save will take place.  If the user is using the keyboard to navigate around, onBlur events still occur but the
     * saving should have already happened as part of the `onSaveEdit` call (triggered from `handleKeyPress`) and so
     * `isSaved` should be false, avoiding a doubled-up request to save when using the keyboard to navigate.
     */
    const itemRef = { fieldName, bookingNumber: record.bookingNumber };
    const [isSaved, setIsSaved] = useState(false);
    const dispatch = useDispatch();
    const formName = `dispatchTable${record.id}${fieldName}`;
    const errors = useRef([]);
    const isOpen = useSelector(state => {
        const bookingOpenItems = state.DispatchItems.get(record.bookingNumber);
        return bookingOpenItems && bookingOpenItems.has(fieldName);
    });
    const onNonEditingClick = () => openItem(itemRef);
    const onSaveEdit = event => {
        const updatedRecord = { [fieldName]: event.target.value };
        const updatedFields = {};
        updatedFields[fieldName] = transformValue(updatedRecord[fieldName]);
        return dispatch(updateModel(record, updatedFields, { optimistic: true })).then(
            () => {
                setIsSaved(true);
                errors.current = [];
            },
            error => {
                let errorMessage = 'There was a problem saving change, please try again';
                if (
                    error.response &&
                    typeof error.response == 'object' &&
                    error.response[fieldName]
                ) {
                    errorMessage = error.response[fieldName];
                }
                message.error({
                    content: (
                        <>
                            Save failed: {errorMessage}{' '}
                            <Button
                                onClick={() => {
                                    openItem(itemRef);
                                    message.destroy();
                                }}
                                type="link"
                            >
                                Edit
                            </Button>
                        </>
                    ),
                    duration: 10,
                    key: 'dispatchSaveFailed',
                });
                errors.current = [' '];
            }
        );
    };

    const handleKeyPress = event => {
        const actionFunction = getFunctionForKey(event);
        if (actionFunction) {
            actionFunction(itemRef);
            onSaveEdit(event);
            event.preventDefault();
        }
    };

    const handleFocus = event => {
        event.target.select();
        setIsSaved(false);
    };
    const handleBlur = event => {
        if (!isSaved) {
            onSaveEdit(event);
        }
        closeItem(itemRef);
    };

    return {
        isOpen,
        formName,
        errors,
        onNonEditingClick,
        onSaveEdit,
        handleKeyPress,
        handleFocus,
        handleBlur,
    };
}
