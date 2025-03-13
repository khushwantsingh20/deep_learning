import { Col, Radio, Row } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';

import ScbpModelForm from '../../../common/data/ScbpModelForm';
import ArchiveSaveFooter from '../../../common/components/ArchiveSaveFooter';
import { Account } from '../../../common/user/models';
import { CategoryType, PaymentMethodType, PaymentTermsType } from '../../../choiceConstants';
import AccountToClientsList from './AccountToClientList';
import AssignCreditCardModal from './AssignCreditCardModal';

import styles from './AccountForm.less';

function AccountPaymentMethodRadioComponent({ paymentTerms, value, ...rest }) {
    if (paymentTerms === PaymentTermsType.COD.value) {
        const isDisabled = parseInt(value, 10) === PaymentMethodType.INVOICE.value;
        return <Radio disabled={isDisabled} value={value} {...rest} />;
    }
    return <Radio value={value} {...rest} />;
}

AccountPaymentMethodRadioComponent.propTypes = {
    paymentTerms: PropTypes.number.isRequired,
    value: PropTypes.string.isRequired,
};

export default function AccountForm({ linkClient, ...props }) {
    const { paymentTerms, paymentMethod, category } = useFormValues(props.formName, [
        'paymentTerms',
        'paymentMethod',
        'category',
    ]);

    const [{ card, encryptedCard }, setCard] = useState({});
    const handleSubmit = data => {
        const finalData = { ...data };
        if (linkClient) {
            finalData.linkClient = linkClient;
        }
        if (encryptedCard) {
            finalData.encryptedCard = encryptedCard;
        } else if (finalData.hasOwnProperty('encryptedCard')) {
            // Ensure encryptedCard is not passed in to server if empty
            // - server can't handle empty encryptedCard object
            delete finalData.encryptedCard;
        }
        return props.onSubmit(finalData);
    };
    return (
        <>
            <ScbpModelForm
                footer={<ArchiveSaveFooter record={props.record} model={Account} />}
                layout="vertical"
                {...props}
                onSubmit={handleSubmit}
            >
                <Row gutter={30}>
                    <Col span={12}>
                        <ScbpModelForm.Item name="accountNickname" />
                        <ScbpModelForm.Item name="accountEmail" />
                        <Row gutter={30}>
                            <Col span={12}>
                                <ScbpModelForm.Item name="contactPhoneMobile" />
                            </Col>
                            <Col span={12}>
                                <ScbpModelForm.Item name="contactPhoneLandline" />
                            </Col>
                        </Row>
                    </Col>
                    <Col span={12}>
                        <ScbpModelForm.Item name="contactTitle" />
                        <ScbpModelForm.Item name="contactFirstName" />
                        <ScbpModelForm.Item name="contactLastName" />
                    </Col>
                </Row>

                <hr />

                <Row gutter={30}>
                    <Col span={12}>
                        <ScbpModelForm.Item name="billingAddress" />
                        <ScbpModelForm.Item name="rateSchedule" />
                        <ScbpModelForm.Item name="category" />
                        {category === CategoryType.BUSINESS.value && (
                            <ScbpModelForm.Item name="businessName" />
                        )}
                    </Col>
                    <Col span={12}>
                        <ScbpModelForm.Item name="paymentTerms" />
                        <ScbpModelForm.Item
                            name="paymentMethod"
                            fieldProps={{
                                radioComponent: componentProps => (
                                    <AccountPaymentMethodRadioComponent
                                        paymentTerms={paymentTerms}
                                        {...componentProps}
                                    />
                                ),
                            }}
                        />
                        {paymentMethod === PaymentMethodType.CREDIT_CARD.value &&
                            !props.record &&
                            !encryptedCard && (
                                <div className={styles.ccSection}>
                                    <AssignCreditCardModal
                                        buttonText="Add Credit Card"
                                        setCard={setCard}
                                    />
                                </div>
                            )}

                        {paymentMethod === PaymentMethodType.CREDIT_CARD.value && encryptedCard && (
                            <div className={styles.ccSection}>
                                Card assigned. <strong>Last digits:</strong> {card.last4}{' '}
                                <strong>Exp:</strong> {card.expiryMonth}/{card.expiryYear}.
                            </div>
                        )}

                        {paymentMethod === PaymentMethodType.CREDIT_CARD.value &&
                            props.record &&
                            !encryptedCard &&
                            props.record.creditCard && (
                                <div className={styles.ccSection}>
                                    <Row>
                                        <Col span={6}>
                                            <strong>Card Type:</strong>{' '}
                                            {props.record.creditCard.cardType}
                                        </Col>
                                        <Col span={5}>
                                            <strong>Last Digits:</strong>{' '}
                                            {props.record.creditCard.toJS().last4}
                                        </Col>
                                        <Col span={4}>
                                            <strong>Exp:</strong> {props.record.creditCard.expMonth}{' '}
                                            /{props.record.creditCard.expYear}
                                        </Col>
                                    </Row>
                                    <AssignCreditCardModal
                                        buttonText="Replace Credit Card"
                                        setCard={setCard}
                                    />
                                </div>
                            )}
                        {paymentMethod === PaymentMethodType.DRIVER_COLLECT.value && (
                            <ScbpModelForm.Item name="driverCollectMethod" />
                        )}
                        <ScbpModelForm.Item name="invoicingMethod" />
                    </Col>
                </Row>

                {paymentTerms !== PaymentTermsType.COD.value && (
                    <>
                        <hr />
                        <Row gutter={30}>
                            <Col span={12}>
                                <ScbpModelForm.Item name="approvedBy" />
                            </Col>
                        </Row>
                    </>
                )}
            </ScbpModelForm>
            {(props.record || !linkClient) && <hr />}
            {!props.record && !linkClient && (
                <div>This Account needs to be saved before it can be linked to a client.</div>
            )}
            {props.record && <AccountToClientsList account={props.record} />}
        </>
    );
}

AccountForm.propTypes = {
    record: modelInstance(),
    formName: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    // If specified created account will be linked to this client
    linkClient: PropTypes.number,
};
