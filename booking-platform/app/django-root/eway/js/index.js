import { useCallback } from 'react';
import useInjectScript from './useInjectScript';
import EncryptedCreditCardFields from './EncryptedCreditCardFields';

function useInjectEwayCrypt(encryptionKey) {
    if (!encryptionKey) {
        throw new Error('You must specify the encryption key to use');
    }
    const { error, isLoaded } = useInjectScript(
        'eway-ecrypt',
        'https://secure.ewaypayments.com/scripts/eCrypt.min.js'
    );

    const encryptValue = useCallback(value => window.eCrypt.encryptValue(value, encryptionKey), [
        encryptionKey,
    ]);

    return { error, isLoaded, encryptValue };
}

export { EncryptedCreditCardFields, useInjectEwayCrypt };
