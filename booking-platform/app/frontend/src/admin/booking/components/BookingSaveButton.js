import { Button, Popconfirm } from 'antd';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { useStore } from 'react-redux';
import { getFormValues } from 'redux-form';

import { modelInstance } from '@alliance-software/djrad/prop-types/model';

import { useCardExpired } from '../../account/components/ExpiredCreditCardWarning';
import { BookingStatus } from '../../../choiceConstants';
import ScbpModelForm from '../../../common/data/ScbpModelForm';

const FormButton = ScbpModelForm.Button;

export default function BookingSaveButton({ accountId, formName, operators, priceTotal, record }) {
    const store = useStore();

    const areFormValuesInvalid = useCallback(() => {
        const values = getFormValues(formName)(store.getState());
        return !priceTotal || !operators.hasRequiredValuesForPriceEstimate(values);
    }, [formName, operators, priceTotal, store]);

    const isExpired = useCardExpired(accountId);
    const mayShowConfirmation = record || !areFormValuesInvalid();

    let button = (
        <FormButton type="primary" htmlType="submit">
            Save Booking
        </FormButton>
    );

    if (!record) {
        if (isExpired && mayShowConfirmation) {
            return (
                <Popconfirm
                    onConfirm={operators.createSubmit}
                    title="This account's credit card is expired. Are you sure you want to continue?"
                >
                    <Button type="primary">Save Booking</Button>
                </Popconfirm>
            );
        }
        return (
            <Button
                disabled={areFormValuesInvalid()}
                onClick={operators.createSubmit}
                type="primary"
            >
                Save Booking
            </Button>
        );
    }
    if (
        record &&
        [BookingStatus.UNVERIFIED.value, BookingStatus.CHANGED.value].includes(record.bookingStatus)
    ) {
        button = (
            <FormButton type="primary" htmlType="submit">
                Save and Verify
            </FormButton>
        );
    }
    if (
        record &&
        (record.invoiceSentDate || record.bookingStatus === BookingStatus.COMPLETED.value)
    ) {
        const ccAction = Number(record.priceTotal) > priceTotal ? 'refund' : 'charge';
        let title =
            'Saving this booking will issue an additional invoice' +
            (record.willChargeOnComplete ? ` and ${ccAction} this account's credit card` : '') +
            '. Are you sure?';
        if (isExpired) {
            title = (
                <div>
                    <p>This account&apos;s credit card is expired.</p>
                    <p>{title}</p>
                </div>
            );
        }
        return (
            <Popconfirm
                title={title}
                onConfirm={operators.updateSubmit}
                okText="Save and Issue Invoice"
                cancelText="No"
            >
                <Button type="primary">Save Booking</Button>
            </Popconfirm>
        );
    }

    if (isExpired && mayShowConfirmation) {
        return (
            <Popconfirm title="This account's credit card is expired. Are you sure you want to continue?">
                {button}
            </Popconfirm>
        );
    }
    return button;
}

BookingSaveButton.propTypes = {
    formName: PropTypes.string.isRequired,
    operators: PropTypes.shape({
        createSubmit: PropTypes.func.isRequired,
        hasRequiredValuesForPriceEstimate: PropTypes.func.isRequired,
        updateSubmit: PropTypes.func.isRequired,
    }),
    priceTotal: PropTypes.number,
    record: modelInstance('scbp_core.booking'),
};

BookingSaveButton.defaultValues = {
    priceTotal: 0,
};
