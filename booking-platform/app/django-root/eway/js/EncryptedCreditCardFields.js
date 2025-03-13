import PropTypes from 'prop-types';
import React, { useEffect, useReducer, useState } from 'react';
import { PaymentInputsWrapper, usePaymentInputs } from 'react-payment-inputs';
import images from 'react-payment-inputs/images';
import { useInjectEwayCrypt } from './index';

import styles from './EncryptedCreditCardFields.less';

function reducer(state, action) {
    const { name, value } = action;
    return {
        ...state,
        [name]: value,
    };
}

export default function EncryptedCreditCardFields({
    ewayEncryptionKey,
    onChange,
    renderScriptError = () => 'There was a problem loading the form, please refresh the page',
}) {
    const { isLoading, error, encryptValue } = useInjectEwayCrypt(ewayEncryptionKey);
    const [card, dispatch] = useReducer(reducer, {});
    const [nameTouched, setNameTouched] = useState(false);

    const {
        meta,
        getCardImageProps,
        getCardNumberProps,
        getExpiryDateProps,
        getCVCProps,
        wrapperProps,
    } = usePaymentInputs({
        onChange: e => {
            dispatch({ name: e.target.name, value: e.target.value });
        },
        onBlur: e => {
            dispatch({ name: e.target.name, value: e.target.value });
        },
    });
    const isValid = !meta.error && !!card.name;
    const { cardType } = meta || {};

    useEffect(() => {
        const [expiryMonth, expiryYear] = card.expiryDate
            ? card.expiryDate.split('/').map(v => v.trim())
            : [];
        const data = {
            isValid,
            card: {
                ...card,
                last4: card.cardNumber ? card.cardNumber.slice(-4) : '',
                expiryMonth,
                expiryYear,
                cardType: cardType && cardType.type,
                cardTypeDisplayName: cardType && cardType.displayName,
            },
        };
        if (isValid && card.cardNumber && card.cvc) {
            data.encryptedCard = {
                ...data.card,
                cardNumber: encryptValue(card.cardNumber.replace(/ /g, '')),
                cvn: encryptValue(card.cvc),
            };
            // eway refers to it as CVN on it's API so just use that only
            delete data.encryptedCard.cvc;
        }
        onChange(data);
    }, [card, cardType, encryptValue, isValid, onChange]);
    if (isLoading) {
        return null;
    }
    if (error) {
        return renderScriptError();
    }
    const showNameError = !card.name && nameTouched;
    return (
        <>
            <input
                onChange={e => dispatch({ name: 'name', value: e.target.value })}
                onBlur={() => setNameTouched(true)}
                placeholder="Name on card"
                className={`${styles.name} ${showNameError ? styles.errorInput : ''}`}
            />
            {showNameError && <div className={styles.error}>Please enter card holder name</div>}
            <PaymentInputsWrapper {...wrapperProps}>
                <svg {...getCardImageProps({ images })} />
                <input {...getCardNumberProps()} />
                <input {...getExpiryDateProps()} />
                <input {...getCVCProps()} />
            </PaymentInputsWrapper>
        </>
    );
}

EncryptedCreditCardFields.propTypes = {
    /**
     * Encryption key provided by eWay
     */
    ewayEncryptionKey: PropTypes.string.isRequired,
    /**
     * Called whenever card changes. Passed an object with this structure:
     * {
     *    "isValid": true,
     *    "card": {
     *      "name": "test",
     *      "cardNumber": "4000 0003 6000 0006",
     *      "expiryDate": "10 / 22",
     *      "cvc": "123",
     *      "last4": "0006",
     *      "expiryMonth": "10",
     *      "expiryYear": "22",
     *      "cardType": "visa",
     *      "cardTypeDisplayName": "Visa"
     *    },
     *    "encryptedCard": {
     *      "name": "test",
     *      "cardNumber": "eCrypted:FFNM16lPiy71hm7BKV82BmBL6G+L3OhG9jv1qpxQCkBAWakkzRw2ha/8UlwmxSHm2lba0EJ66nQd5Cg9xQgn9wbVv/t1vRjhWdvkYS9y5sabdrGVyzxaYofKwnPGWW3B5s0Jf+58d0wBBPrYNJT6csWsHutfaZN5aRZ2xYUvzm3/OQP0Jk7Gi2z230WC6Rombs3PJvuBL9d+sRLCrR8hMHYvMxlm/r4bULCBUggvS310PjNdtuuyLJBxg3A2jFIvtRRNTkn/Qt3V4U74MOn1nbfY/DDmgXOp/K/F4tO8GAPUdLzoqBAfcbhCKBFb2f4uI88SCRFhWeVeyOly1LdZuQ==",
     *      "expiryDate": "10 / 22",
     *      "last4": "0006",
     *      "expiryMonth": "10",
     *      "expiryYear": "22",
     *      "cardType": "visa",
     *      "cardTypeDisplayName": "Visa",
     *      "cvn": "eCrypted:IusLJqxBf1bJOGWjHcqfFJUJyMNzBSYB7pH/cKPSZDXdEHzTqNVszEODECBlUrBcajmDLrj6HSD5Beb4FAfRA9wcWxO3V4BXSdPIn1naALn6dyqipqpAp+LphhivwQxCdekbbQosL5ylOOE/C1Kdd3tPWdXdwUMQ0IAQc7E1AELJB2/uj916np59xbk43miuzwdmoniETzs0LADquFU5Zo7qs5RkXFgtD35FF98zynUGCxWCs+fcD4NO8fG9zgNpEkDwHUelv4rTJOMoV59PpLozvcrVu0kdmfLMXc1O/WGEffEmwb5abJk0A1qxhBCfYeZzY+HtlDxVDaWR/6bsLQ=="
     *    }
     * }
     *
     * data.encryptedCard is what should be passed to the backend for creating a token.
     */
    onChange: PropTypes.func.isRequired,
    /**
     * Called if script fails to load. Should return something to render.
     */
    renderScriptError: PropTypes.func,
};
