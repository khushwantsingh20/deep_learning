import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import RadioChoicesWidget from '@alliance-software/djrad/components/form/widgets/RadioChoicesWidget';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Col, Row } from 'antd';
import { useDispatch } from 'react-redux';
import { change } from 'redux-form';

import { useActiveAccount } from '../../app/user/hooks';
import IconButton from '../ui/IconButton';
import {
    BookingPaymentMethod,
    bookingDriverCollectMethodChoices,
    BookingDriverCollectMethod,
} from '../../choiceConstants';
import { ReactComponent as IconAccount } from '../../images/icon-payment-default.svg';
import { ReactComponent as IconDriver } from '../../images/icon-pay-driver.svg';

import styles from './BookingPaymentWidget.less';

const ACCOUNT_SELECTED = 'account';
const DRIVER_SELECTED = 'driver';

export default function BookingPaymentWidget({ meta: { form: formName } }) {
    const dispatch = useDispatch();
    const [selected, setSelected] = useState();
    const { bookingPaymentMethod, driverCollectMethod } = useFormValues(formName, [
        'bookingPaymentMethod',
        'driverCollectMethod',
    ]);
    const activeAccount = useActiveAccount();

    const onAccountSelect = () => {
        setSelected(ACCOUNT_SELECTED);
        if (activeAccount) {
            dispatch(change(formName, 'bookingPaymentMethod', activeAccount.paymentMethod));
            if (activeAccount.paymentMethod === BookingPaymentMethod.DRIVER_COLLECT.value) {
                dispatch(
                    change(formName, 'driverCollectMethod', activeAccount.driverCollectMethod)
                );
            } else {
                dispatch(
                    change(formName, 'driverCollectMethod', BookingDriverCollectMethod.NONE.value)
                );
            }
        }
    };

    const onPayDriverSelect = () => {
        setSelected(DRIVER_SELECTED);
        if (bookingPaymentMethod !== BookingPaymentMethod.DRIVER_COLLECT.value) {
            dispatch(
                change(formName, 'bookingPaymentMethod', BookingPaymentMethod.DRIVER_COLLECT.value)
            );
        }
    };

    const onDriverCollectMethod = async event => {
        const newValue = Number(event.target.value);
        if (driverCollectMethod !== newValue) {
            await dispatch(
                change(formName, 'bookingPaymentMethod', BookingPaymentMethod.DRIVER_COLLECT.value)
            );
            await dispatch(change(formName, 'driverCollectMethod', newValue));
        }
    };

    return (
        <>
            <Row type="flex" align="middle">
                <Col md={{ span: 12 }}>
                    <IconButton
                        icon={<IconAccount />}
                        label="Account Default"
                        onSelect={onAccountSelect}
                        selected={selected === ACCOUNT_SELECTED}
                        disabled={!activeAccount}
                    />
                    <IconButton
                        icon={<IconDriver />}
                        label="Pay Driver Directly"
                        onSelect={onPayDriverSelect}
                        selected={selected === DRIVER_SELECTED}
                    />
                </Col>
                <Col md={{ span: 12 }}>
                    {selected === DRIVER_SELECTED && (
                        <fieldset className={styles.payDriverOptions}>
                            <legend>How you would like to pay the driver?</legend>
                            <RadioChoicesWidget
                                value={driverCollectMethod}
                                onChange={onDriverCollectMethod}
                                choices={bookingDriverCollectMethodChoices}
                            />
                        </fieldset>
                    )}
                </Col>
            </Row>
            {activeAccount && selected === 'account' && (
                <Row className={styles.accountName}>
                    <strong>This booking is being billed to:</strong>{' '}
                    {activeAccount.accountNickname}
                </Row>
            )}
        </>
    );
}

BookingPaymentWidget.propTypes = {
    meta: PropTypes.object.isRequired,
};
