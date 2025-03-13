import InputWidget from '@alliance-software/djrad/components/form/widgets/InputWidget';
import PropTypes from 'prop-types';
import FormContext from '@alliance-software/djrad/components/form/formContext';
import FormField from '@alliance-software/djrad/components/form/FormField';
import CheckboxWidget from '@alliance-software/djrad/components/form/widgets/CheckboxWidget';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import { Button, Col, Modal, Row } from 'antd';
import React, { useContext, useState } from 'react';
import { BookingAddressType, ClientAddressType } from '../../../choiceConstants';
import { AddressFormatter } from '../../../common/fields/AddressField';
import FlightNumberWidget from '../../../common/form/FlightNumberWidget';
import TimeWidget from '../../../common/form/TimeWidget';
import { numeric } from '../../../common/prop-types';
import { ReactComponent as RemoveIcon } from '../../../images/icon-circle-cross-filled.svg';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import AddressLookupWidget from '../../../common/form/AddressLookupWidget';
import AddressCreate from './AddressCreate';
import AddressPickerModal from './AddressPickerModal';

import styles from './BookingAddressEntry.less';
import BookingValueWidget, { BookingValueRenderer } from './BookingValueWidget';

const { Item } = ScbpModelForm;

function InstructionsFormatter(props) {
    const { value } = props;
    if (!value) {
        return <em>None</em>;
    }
    return value;
}

function PickUpFormatter({ value }) {
    if (value) {
        return 'Pick up';
    }
    return 'Drop off';
}

export default function BookingAddressEntry({
    name,
    label,
    showLabel = true,
    isAdditionalStop = false,
    onRemove,
    canRemove,
    onSortChange,
    sortIndex,
    sortIndexMax,
    clientUserId,
    accountId,
}) {
    const [addressPickerVisible, setAddressPickerVisible] = useState(false);
    const [addressSave, setAddressSave] = useState(false);
    const isPickup = name === 'fromAddress';
    const isDropoff = name === 'destinationAddress';
    const { getFormPath } = useContext(FormContext);
    const formName = getFormPath();
    const formValues = useFormValues(
        formName,
        [
            name,
            isPickup && 'fromAirportDriverRequiredOnLanding',
            isPickup && 'fromAddressType',
            isDropoff && 'destinationAddressType',
        ].filter(Boolean)
    );
    const formActions = useFormActions(formName);

    const onPlaceChange = newAddress => {
        formActions.change(name, newAddress);
        // Reset the address type to custom - this is called only if the user manually enters an address
        formActions.change(`${name}Type`, BookingAddressType.CUSTOM.value);
    };

    const onSaveClick = newAddress => {
        setAddressSave({ address: newAddress });
    };

    function closeModal() {
        setAddressSave(false);
    }

    const renderAddAddressModal = () => {
        if (!addressSave) {
            return null;
        }

        return (
            <Modal
                onCancel={() => closeModal()}
                title="Add Address"
                footer={null}
                visible
                className="modal-md"
            >
                <AddressCreate
                    {...addressSave}
                    clientUserId={clientUserId}
                    addressType={ClientAddressType.OTHER}
                    onSuccess={({ record }) => {
                        formActions.change(
                            `${name}.addressInstructions`,
                            record.addressInstructions
                        );
                        formActions.change(`${name}.addressLabel`, record.addressLabel);
                        closeModal();
                    }}
                />
            </Modal>
        );
    };

    return (
        <div className={styles.addressEntry}>
            <Row gutter={30}>
                <Col span={15}>
                    <Item label={showLabel && label}>
                        <FormField
                            name={name}
                            widget={
                                <BookingValueWidget
                                    widget={
                                        <AddressLookupWidget
                                            acceptRouteOnly
                                            onSaveClick={clientUserId && onSaveClick}
                                            // For some reason onPlaceChange below gets swallowed up before
                                            // reaching AddressLookupWidget. Since putting it on FormField
                                            // actually achieves the desired result, I'm sending a no-op
                                            // to AddressLookupWidget avoid propTypes issues here
                                            onChange={() => {}}
                                        />
                                    }
                                    formatterComponent={AddressFormatter}
                                />
                            }
                            showIcon
                            onChange={onPlaceChange}
                            onClickIcon={() => clientUserId && setAddressPickerVisible(true)}
                            onSortChange={onSortChange}
                            sortIndex={sortIndex}
                            sortIndexMax={sortIndexMax}
                        />
                    </Item>
                </Col>
                <Col span={isAdditionalStop ? 6 : 9}>
                    <Item label={showLabel && 'Instruction'}>
                        <FormField
                            name={`${name}.addressInstructions`}
                            formatterComponent={InstructionsFormatter}
                            widget={<BookingValueWidget widget={InputWidget} />}
                        />
                    </Item>
                </Col>
                {isAdditionalStop && (
                    <Col span={3}>
                        <Item
                            label={showLabel && <>&nbsp;</>}
                            className={styles.additionalStopControls}
                        >
                            <FormField
                                name={`${name}.isPickUp`}
                                widget={
                                    <BookingValueWidget
                                        formatterComponent={PickUpFormatter}
                                        widget={<CheckboxWidget>Pick up</CheckboxWidget>}
                                    />
                                }
                            />
                            {canRemove && (
                                <BookingValueRenderer
                                    fieldName={name}
                                    renderWrite={() => (
                                        <Button
                                            onClick={onRemove}
                                            type="link"
                                            className={styles.removeButton}
                                        >
                                            <RemoveIcon />
                                        </Button>
                                    )}
                                />
                            )}
                        </Item>
                    </Col>
                )}
            </Row>
            {isPickup && formValues.fromAddressType === BookingAddressType.AIRPORT.value && (
                <Row gutter={30} className={styles.airportRow}>
                    <Col span={7}>
                        <Item
                            wrapperCol={{ span: 12 }}
                            labelCol={{ span: 12 }}
                            label="Flight number"
                            name="fromFlightNumber"
                            widget={<FlightNumberWidget autoFocus />}
                        />
                    </Col>
                    <Col span={8}>
                        <Item
                            wrapperCol={{ span: 7 }}
                            labelCol={{ span: 17 }}
                            label="Driver in terminal from landing time?"
                            name="fromAirportDriverRequiredOnLanding"
                            fieldProps={{
                                allowClear: false,
                            }}
                        />
                    </Col>
                    {!formValues.fromAirportDriverRequiredOnLanding && (
                        <Col span={8}>
                            <Item
                                wrapperCol={{ span: 11 }}
                                labelCol={{ span: 13 }}
                                label="How long after landing?"
                                name="fromAirportArrivalAfterLanding"
                            />
                        </Col>
                    )}
                </Row>
            )}
            {isDropoff && formValues.destinationAddressType === BookingAddressType.AIRPORT.value && (
                <Row gutter={30} className={styles.airportRow}>
                    <Col span={10}>
                        <Item
                            wrapperCol={{ span: 20 }}
                            labelCol={{ span: 4 }}
                            label="Terminal"
                            name="destinationAirportTerminal"
                        />
                    </Col>
                    <Col span={12}>
                        <Item
                            wrapperCol={{ span: 12 }}
                            labelCol={{ span: 12 }}
                            name="destinationFlightDepartureTime"
                            widget={TimeWidget}
                            fieldProps={{ minuteStep: 5 }}
                        />
                    </Col>
                </Row>
            )}
            {clientUserId && (
                <AddressPickerModal
                    visible={addressPickerVisible}
                    onClose={() => setAddressPickerVisible(false)}
                    onAddressPicked={address => {
                        if (address.addressInstructions) {
                            formActions.change(
                                `${name}.addressInstructions`,
                                address.addressInstructions
                            );
                        }

                        if (address.addressLabel) {
                            formActions.change(`${name}.addressLabel`, address.addressLabel);
                        }

                        formActions.change(name, {
                            isValidAddress: true,
                            ...(address.toJS ? address.toJS() : address),
                        });
                        formActions.change(`${name}Type`, address.addressType);
                    }}
                    client={clientUserId}
                    account={accountId}
                />
            )}
            {renderAddAddressModal()}
        </div>
    );
}

BookingAddressEntry.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    showLabel: PropTypes.bool,
    clientUserId: numeric,
    accountId: numeric,
    isAdditionalStop: PropTypes.bool,
    // The below are only available if isAdditionalStop is true
    onRemove: PropTypes.func,
    onSortChange: PropTypes.func,
    sortIndex: PropTypes.number,
    sortIndexMax: PropTypes.number,
    canRemove: PropTypes.bool,
};
