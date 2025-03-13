import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import { Button, Modal } from 'antd';
import { PropTypes } from 'prop-types';
import React, { useState } from 'react';
import { modelClass } from '@alliance-software/djrad/prop-types/model';
import { CategoryType } from '../../../choiceConstants';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import EwayCreditCardForm from '../../../common/form/EwayCreditCardForm';
import { Account } from '../../../common/user/models';

import styles from '../views/ClientAccountCreateView.less';

function ClientAccountForm({ record, ...props }) {
    const { category } = useFormValues(props.formName, ['category']);
    const [modal, showModal] = useState(false);
    let initialState = {};
    if (record && record.creditCard) {
        initialState = {
            encryptedCard: record.encryptedCard,
            card: {
                cardTypeDisplayName: record.creditCard.cardType,
                name: '',
                expiryMonth: `${record.creditCard.expMonth < 10 ? '0' : ''}${
                    record.creditCard.expMonth
                }`,
                expiryYear: record.creditCard.expYear,
                last4: record.creditCard.last4,
            },
        };
    }
    const [{ card, encryptedCard }, setCard] = useState(initialState);

    const onSubmit = data => {
        return props.onSubmit({
            ...data,
            encryptedCard,
        });
    };

    const footer = (
        <div className={styles.footer}>
            <div className={styles.buttons}>
                <p>
                    <em>
                        You will not be able to make bookings from this account until Credit Card
                        details are validated or trading terms have been finalised.
                    </em>
                </p>

                <p>
                    <ScbpModelForm.Button
                        htmlType="submit"
                        type="primary"
                        data-testid="create-account-button"
                    >
                        {record ? 'Update' : 'Create'} account
                    </ScbpModelForm.Button>
                </p>
            </div>
            <section className={styles.tradingTerms}>
                <h3 className="h3">Trading terms</h3>
                <p>We provide a variety of trading terms for select business customers.</p>
                <p>
                    <a href={'/assets/credit-application-form.pdf'}>
                        Download our application form
                    </a>{' '}
                    for trading terms with Southern Cross.
                </p>
            </section>
        </div>
    );

    return (
        <>
            <ScbpModelForm
                layout="horizontal"
                model={Account}
                record={record}
                footer={footer}
                {...props}
                onSubmit={onSubmit}
                submissionErrorsMessage={null}
            >
                <ScbpModelForm.Item name="category" />
                {category === CategoryType.BUSINESS.value && (
                    <ScbpModelForm.Item name="businessName" />
                )}
                <ScbpModelForm.Item name="accountNickname" />

                <hr />
                <fieldset>
                    <legend>Credit card details</legend>
                    <div className={styles.addCC}>
                        {!card && <Button onClick={() => showModal(true)}>Add Credit Card</Button>}

                        {card && (
                            <>
                                <div className={styles.ccDetails}>
                                    <p>Your credit card:</p>
                                    <dl>
                                        <dt>Card type:</dt>
                                        <dd>{card.cardTypeDisplayName}</dd>
                                        <dt>Card Holder:</dt>
                                        <dd>{card.name}</dd>
                                        <dt>Exp. month:</dt>
                                        <dd>{card.expiryMonth}</dd>
                                        <dt>Exp. year:</dt>
                                        <dd>{card.expiryYear}</dd>
                                        <dt>Last four digits:</dt>
                                        <dd>{card.last4}</dd>
                                    </dl>
                                </div>
                                <Button onClick={() => showModal(true)}>Wrong Card? Change</Button>
                            </>
                        )}
                    </div>
                </fieldset>
            </ScbpModelForm>
            <Modal
                title="Assign Credit Card"
                visible={modal}
                footer={null}
                onCancel={() => showModal(false)}
                width={365}
            >
                <EwayCreditCardForm
                    onValidCard={data => {
                        showModal(false);
                        return setCard(data);
                    }}
                />
            </Modal>
        </>
    );
}

export default ClientAccountForm;

ClientAccountForm.propTypes = {
    onSubmit: PropTypes.func,
    record: modelClass('scbp_core.account'),
    formName: PropTypes.string.isRequired,
};
