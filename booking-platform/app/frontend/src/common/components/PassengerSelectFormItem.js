import useModelClass from '@alliance-software/djrad/hooks/useModelClass';
import React, { useMemo } from 'react';
import SelectChoicesWidget from '@alliance-software/djrad/components/form/widgets/SelectChoicesWidget';
import useAsync from '@alliance-software/djrad/hooks/useAsync';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import PropTypes from 'prop-types';
import api from '../api';
import ScbpModelForm from '../data/ScbpModelForm';
import { numeric } from '../prop-types';
import PassengerGuestLookupWidget from './PassengerGuestLookupWidget';
import PassengerGuestFormatter from './PassengerGuestFormatter';

/**
 * Select passenger with special handling for 'guest' option.
 *
 * Always passes a valid foreign key value or null to the 'passenger' field and
 * tracks 'guest' separately on a different field ('passengerGuest').
 */
function PassengerSelectWidget({
    value,
    isGuestSelected,
    onChange,
    onGuestChange,
    onBlur,
    isLoading,
    ...rest
}) {
    if (isGuestSelected) {
        value = 'guest';
    }
    const handleChange = val => {
        const passengerGuest = val === 'guest';
        onGuestChange(passengerGuest);
        onChange && onChange(passengerGuest ? null : Number(val));
    };
    const handleBlur = val => {
        const passengerGuest = val === 'guest';
        onGuestChange(passengerGuest);
        onBlur && onBlur(passengerGuest ? null : Number(val));
    };
    const transformedValue = value ? String(value) : value;
    if (value && !isLoading && rest.choices.filter(choice => choice[0] === value).length === 0) {
        handleChange(rest.choices[0][0]);
    }
    return (
        <SelectChoicesWidget
            value={isLoading ? null : transformedValue}
            onChange={handleChange}
            onBlur={handleBlur}
            {...rest}
            disabled={isLoading || rest.disabled}
            loading={isLoading}
        />
    );
}

PassengerSelectWidget.propTypes = {
    isLoading: PropTypes.bool,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isGuestSelected: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onGuestChange: PropTypes.func.isRequired,
};

const listPassengers = account => {
    // If no account available yet don't do anything; will fetch again once account is available
    if (!account) {
        return Promise.resolve();
    }
    return api.detailRouteGet(account, 'passenger-list');
};

// eslint-disable-next-line react/prop-types
function defaultRenderFormItem({ passengerField, guestLookup }) {
    return (
        <ScbpModelForm.Item>
            {passengerField}
            {guestLookup}
        </ScbpModelForm.Item>
    );
}

const passengerLabel = record => {
    return `${record.name} (${record.phone || 'no phone number set'})`;
};

/**
 * Render passenger select drop down with guest option
 *
 * NOTE: If you change this test it on the admin update/create page as well
 * as the public booking page.
 */
export default function PassengerSelectFormItem({
    account,
    user,
    userId = user ? user.id : null,
    formName,
    renderItem = defaultRenderFormItem,
}) {
    const Account = useModelClass('scbp_core.account');
    account = useMemo(() => {
        if (typeof account === 'number' || typeof account === 'string') {
            return [Account, account];
        }
        return account;
    }, [Account, account]);
    const accountId = Array.isArray(account) ? account[1] : (account || {}).id;
    const { response, isLoading } = useAsync(listPassengers, {
        args: [account],
        trigger: useAsync.SHALLOW,
    });
    const formActions = useFormActions(formName);
    const { passengerGuest } = useFormValues(formName, ['passengerGuest']);

    const choices = [
        // Put the client user first in the list
        ...(response || [])
            .filter(record => record.id === userId)
            .map(record => [record.id, passengerLabel(record)]),
        // Followed by other allowed users on the account
        ...(response || [])
            .filter(record => record.id !== userId)
            .map(record => [record.id, passengerLabel(record)]),
        // Ending with 'Guest'
        ['guest', 'Guest'],
    ];
//
    return renderItem({
        passengerField: (
            <ScbpModelForm.Field
                name="passenger"
                widget={
                    <PassengerSelectWidget
                        isLoading={isLoading}
                        onGuestChange={value => formActions.change('passengerGuest', value)}
                        isGuestSelected={passengerGuest}
                        choices={choices}
                        data-testid="passenger-select"
                    />
                }
            />
        ),
        guestLookup: passengerGuest && (
            <PassengerGuestLookupWidget
                formName={formName}
                clientUserId={userId}
                accountId={accountId}
            />
        ),
        guestFormatter: passengerGuest && PassengerGuestFormatter,
    });
}

PassengerSelectFormItem.propTypes = {
    /** This may not yet exist for user so is optional */
    account: PropTypes.oneOfType([
        // Instance of account
        modelInstance('scbp_core.account'),
        // Or account id
        numeric,
    ]),
    /** If specified will populate the first option in drop down with this users name */
    user: modelInstance('scbp_core.clientuser'),
    /** Required in admin to save correct client user reference on guest */
    userId: numeric,
    formName: PropTypes.string.isRequired,
    /** Function to control how item is rendered */
    renderItem: PropTypes.func,
};
