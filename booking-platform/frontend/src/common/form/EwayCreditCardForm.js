import PropTypes from 'prop-types';
import useSettings from '@alliance-software/djrad/hooks/useSettings';
import { EncryptedCreditCardFields } from '@alliance-software/eway';
import { Button } from 'antd';
import React, { useState } from 'react';

import styles from './EwayCreditCardForm.less';

export default function EwayCreditCardForm({ onValidCard }) {
    const { ewayEncryptionKey } = useSettings();
    const [data, setData] = useState({});
    return (
        <form
            onSubmit={e => {
                e.preventDefault();
                e.stopPropagation();
                if (data.isValid) {
                    onValidCard(data);
                }
            }}
        >
            <div className={styles.wrapper}>
                <EncryptedCreditCardFields
                    onChange={setData}
                    ewayEncryptionKey={ewayEncryptionKey}
                />
                <Button
                    htmlType="submit"
                    type="primary"
                    disabled={!data.isValid}
                    className={styles.button}
                >
                    Assign Card
                </Button>
            </div>
        </form>
    );
}

EwayCreditCardForm.propTypes = {
    onValidCard: PropTypes.func.isRequired,
};
