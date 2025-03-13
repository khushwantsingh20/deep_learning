import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Modal, Button } from 'antd';

import EwayCreditCardForm from '../../../common/form/EwayCreditCardForm';

export default function AssignCreditCardModal({ setCard, buttonText }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <Button type="primary" ghost onClick={() => setShowModal(true)}>
                {buttonText}
            </Button>

            <Modal
                title="Assign Credit Card"
                visible={showModal}
                footer={null}
                onCancel={() => setShowModal(false)}
                width={320}
            >
                <EwayCreditCardForm
                    onValidCard={data => {
                        setShowModal(false);
                        return setCard(data);
                    }}
                />
            </Modal>
        </>
    );
}

AssignCreditCardModal.propTypes = {
    setCard: PropTypes.func.isRequired,
    buttonText: PropTypes.string.isRequired,
};
