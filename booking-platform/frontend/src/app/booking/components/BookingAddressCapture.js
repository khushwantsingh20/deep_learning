import getIn from 'lodash/get';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { Button, Modal } from 'antd';
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import React, { useEffect, useState } from 'react';
import { BookingAddressType, ClientAddressType } from '../../../choiceConstants';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import AddressLookupWidget from '../../../common/form/AddressLookupWidget';
import BookingAddressTypeWidget from '../../../common/form/BookingAddressTypeWidget';
import useAddressSourceResolver from '../../../common/hooks/useAddressSourceResolver';
import { ReactComponent as PickupIcon } from '../../../images/icon-clock.svg';
import ClientAddressCreateEdit from '../../components/ClientAddressCreateEdit';
import BookingSavedLocations from './BookingSavedLocations';

import styles from './CreateBookingController.less';
import { airportAddress } from '../../../consts';

/**
 * Capture an address for a booking.
 *
 * Works with both pickup/destination addresses.
 *
 * Shows icons to select type of address (eg. Airport, Home, Custom)
 *
 * and address lookup widget (for use with type is Custom)
 *
 * When an address is manually entered it forces type to 'CUSTOM'. When
 * a type other than custom is selected it clears the address entry field.
 */
export default function BookingAddressCapture({
    formName,
    addressTypeFieldName,
    addressFieldName,
    addresses,
    children,
    canAddAddress,
    currentUserId,
    onClear,
    addressLookupChildren,
    allowPickupOption,
    compact = false,
}) {
    const { resolveAddress } = useAddressSourceResolver();
    const formActions = useFormActions(formName);
    const formValues = useFormValues(formName, [addressTypeFieldName, addressFieldName]);
    // Need to extract values like this rather than destructuring from formValues. This is because when
    // array + dot notation is used (eg. additionalStops[0].addressType) then a nested object is returned
    const addressType = getIn(formValues, addressTypeFieldName);
    const address = getIn(formValues, addressFieldName);
    const [modalProps, setModalProps] = useState(false);

    let homeAddress;
    let officeAddress;
    let otherAddresses = [];
    let selectedAddressBookAddress;
    const missingAddressBookTypes = [];
    if (addresses) {
        homeAddress = addresses
            .filter(
                a => a.client === currentUserId && a.addressType === ClientAddressType.HOME.value
            )
            .first();
        officeAddress = addresses
            .filter(
                a => a.client === currentUserId && a.addressType === ClientAddressType.OFFICE.value
            )
            .first();
        otherAddresses = addresses
            .toArray()
            .filter(a => a.addressType === ClientAddressType.OTHER.value);
        if (address) {
            selectedAddressBookAddress = addresses
                .filter(a => a.sourceId === address.sourceId)
                .first();
            if (!selectedAddressBookAddress && airportAddress.sourceId === address.sourceId) {
                selectedAddressBookAddress = airportAddress;
            }
        }

        if (otherAddresses.length < 1) {
            missingAddressBookTypes.push(ClientAddressType.OTHER.value);
        }
        if (!homeAddress) {
            missingAddressBookTypes.push(ClientAddressType.HOME.value);
        }
        if (!officeAddress) {
            missingAddressBookTypes.push(ClientAddressType.OFFICE.value);
        }
    }
    const isModalOpen = !!modalProps;
    // If address field changes then set the address type field to 'CUSTOM'
    useEffect(() => {
        if (selectedAddressBookAddress) {
            if (selectedAddressBookAddress.addressType !== addressType) {
                formActions.change(addressTypeFieldName, selectedAddressBookAddress.addressType);
            }
        } else if (addressType !== BookingAddressType.CUSTOM.value && !isModalOpen) {
            formActions.change(addressTypeFieldName, BookingAddressType.CUSTOM.value);
        }
    }, [selectedAddressBookAddress, isModalOpen, addressType, addressTypeFieldName, formActions]);

    const onSaveClick = newAddress => {
        setModalProps({ address: newAddress, addressType: BookingAddressType.ADDRESS_BOOK });
    };

    function closeModal() {
        setModalProps(false);
    }

    async function onSelectAddress(adr) {
        formActions.change(addressFieldName, (await resolveAddress(adr)).toJS());
        closeModal();
    }

    const addressTypeSelect = (
        <ScbpModelForm.Item label={null} fullWidth className={styles.fullWidth}>
            <ScbpModelForm.Field
                name={addressTypeFieldName}
                widget={BookingAddressTypeWidget}
                isUserDefinedField
                {...{
                    showAddressBook: !compact,
                    showAirport: !compact,
                    onChange: async value => {
                        if (value === addressType) {
                            // If address type hasn't changed we don't do anything unless the user has clicked
                            // the saved location icon in which case we want to let them choose a different address
                            if (
                                otherAddresses.length > 0 &&
                                value === BookingAddressType.ADDRESS_BOOK.value
                            ) {
                                setModalProps({ addresses: otherAddresses });
                            }
                            return;
                        }
                        if (value === BookingAddressType.HOME.value) {
                            if (homeAddress) {
                                formActions.change(
                                    addressFieldName,
                                    (await resolveAddress(homeAddress)).toJS()
                                );
                                if (compact) {
                                    setModalProps(false);
                                }
                            } else {
                                formActions.change(addressFieldName, null);
                                setModalProps({ addressType: ClientAddressType.HOME });
                            }
                        } else if (value === BookingAddressType.OFFICE.value) {
                            if (officeAddress) {
                                formActions.change(
                                    addressFieldName,
                                    (await resolveAddress(officeAddress)).toJS()
                                );
                                if (compact) {
                                    setModalProps(false);
                                }
                            } else {
                                formActions.change(addressFieldName, null);
                                setModalProps({ addressType: ClientAddressType.OFFICE });
                            }
                        } else if (value === BookingAddressType.ADDRESS_BOOK.value) {
                            formActions.change(addressFieldName, null);
                            // render modal with addresses
                            if (otherAddresses.length > 0) {
                                setModalProps({ addresses: otherAddresses });
                            }
                        } else if (value === BookingAddressType.AIRPORT.value) {
                            formActions.change(addressFieldName, airportAddress);
                            if (compact) {
                                setModalProps(false);
                            }
                        }
                    },
                    canAddAddress,
                    missingAddressBookTypes,
                }}
            />
        </ScbpModelForm.Item>
    );

    function renderModal() {
        if (!modalProps) {
            return null;
        }

        if (modalProps.addresses) {
            return (
                <Modal
                    onCancel={() => closeModal()}
                    title="Choose location"
                    footer={null}
                    visible
                    className="modal-md"
                >
                    {compact && addressTypeSelect}
                    {modalProps.addresses.length > 0 && (
                        <BookingSavedLocations
                            {...modalProps}
                            onSelect={onSelectAddress}
                            clientUserId={currentUserId}
                        />
                    )}
                </Modal>
            );
        }

        return (
            <Modal
                onCancel={() => closeModal()}
                title="Add Address"
                footer={null}
                visible
                className="modal-md"
            >
                <ClientAddressCreateEdit
                    {...modalProps}
                    clientUserId={currentUserId}
                    onSuccess={({ record }) => {
                        formActions.change(addressTypeFieldName, record.addressType);
                        formActions.change(addressFieldName, record.toJS());
                        closeModal();
                    }}
                />
            </Modal>
        );
    }

    const isAirport = addressType === BookingAddressType.AIRPORT.value;

    if (compact) {
        return (
            <>
                <ScbpModelForm.Item label={<span className="sr-only">Address</span>}>
                    <ScbpModelForm.Field
                        name={addressFieldName}
                        isUserDefinedField
                        widget={AddressLookupWidget}
                        {...{
                            size: 'large',
                            disabled: isAirport,
                            allowPickupOption,
                            showIcon: true,
                            showClear: false,
                            onClickIcon: () => setModalProps({ addresses: otherAddresses }),
                        }}
                    >
                        {addressLookupChildren}
                    </ScbpModelForm.Field>
                </ScbpModelForm.Item>
                {renderModal()}
            </>
        );
    }

    return (
        <>
            {addressTypeSelect}
            {isAirport && (
                <>
                    {children}
                    <ScbpModelForm.Item>
                        <Button type="link" onClick={onClear}>
                            Clear
                        </Button>
                    </ScbpModelForm.Item>
                </>
            )}
            {!isAirport && (
                <>
                    <span className={styles.or}>or enter an address</span>
                    <ScbpModelForm.Item
                        widget={AddressLookupWidget}
                        name={addressFieldName}
                        label={<span className="sr-only">Address</span>}
                        fieldProps={{
                            allowPickupOption,
                            size: 'large',
                            showIcon: true,
                            showClear: true,
                            onSaveClick: canAddAddress && onSaveClick,
                        }}
                    />
                </>
            )}

            {!isAirport && addressTypeFieldName === 'fromAddressType' && (
                <div className="ant-row">
                    <ul className={styles.notes}>
                        <li>
                            <PickupIcon aria-hidden="true" />
                            Includes 10 minutes wait time
                        </li>
                    </ul>
                </div>
            )}
            {renderModal()}
        </>
    );
}

BookingAddressCapture.propTypes = {
    formName: PropTypes.string.isRequired,
    /**
     * Name of the address type field. See BookingAddressType for valid values.
     */
    addressTypeFieldName: PropTypes.string.isRequired,
    /**
     * Name of the address capture field itself
     */
    addressFieldName: PropTypes.string.isRequired,
    /**
     * Additional components to be displayed if the address type is AIRPORT
     */
    children: PropTypes.object,
    addresses: ImmutablePropTypes.listOf(modelInstance('scbp_core.clientaddress')),
    /**
     * If true user can add new addresses (eg. HOME, OFFICE). If false these buttons
     * will be disabled.
     */
    canAddAddress: PropTypes.bool,
    onClear: PropTypes.func,
    currentUserId: PropTypes.number,
    /**
     * Render a compact version - primarily aimed at the additional stops interface. The non-compact version
     * is what you see on the first step of the booking process.
     */
    compact: PropTypes.bool,
    /**
     * Any children to pass through to the AddressLookupWidget component
     */
    addressLookupChildren: PropTypes.node,
    /**
     * Passed through tot he AddressLookupWidget,
     */
    allowPickupOption: PropTypes.bool,
};
