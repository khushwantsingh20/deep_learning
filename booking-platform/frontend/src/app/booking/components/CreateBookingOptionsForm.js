import FormField from '@alliance-software/djrad/components/form/FormField';
import CheckboxWidget from '@alliance-software/djrad/components/form/widgets/CheckboxWidget';
import ListItemWidget from '@alliance-software/djrad/components/form/widgets/ListItemWidget';
import ListWidget from '@alliance-software/djrad/components/form/widgets/ListWidget';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import { Button, Col, Row } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { FieldArray } from 'redux-form';
import useAddressBook from '../hooks/useAddressBook';
import BookingAddressCapture from './BookingAddressCapture';

import PriceSummaryBar from './PriceSummaryBar';
import BookingPropTypes from '../prop-types';
import { BookingType } from '../../../choiceConstants';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { formatAuCurrency } from '../../../common/formatters/numeric';
import ColorSelector from '../../../common/ui/ColorSelector';
import NumericChoicesWidget from '../../../common/ui/NumericChoicesWidget';
import { ReactComponent as IconForwardFacing } from '../../../images/icon-forward-facing-babyseat.svg';
import { ReactComponent as IconBooster } from '../../../images/icon-booster-seat.svg';
import { ReactComponent as IconPlus } from '../../../images/icon-plus-circle.svg';
import { ReactComponent as IconRearFacing } from '../../../images/icon-rear-facing-child-seat.svg';
import { ReactComponent as IconRibbon } from '../../../images/icon-ribbon-car.svg';

import styles from './CreateBookingOptionsForm.less';

export default function CreateBookingOptionsForm({ bookingContext, headerBar, ...props }) {
    const { vehicleClass, priceOptions, currentPrice, isInterstate } = bookingContext;
    const isHourly = bookingContext.data.bookingType === BookingType.HOURLY.value;
    const childSeatLimit = vehicleClass.maxChildSeatCount;
    const {
        boosterSeatCount,
        forwardFacingBabySeatCount,
        rearFacingBabySeatCount,
        requiresWeddingRibbons,
        vehicleColorId,
        additionalStops,
    } = useFormValues(props.name, [
        'requiresWeddingRibbons',
        'vehicleColorId',
        'boosterSeatCount',
        'forwardFacingBabySeatCount',
        'rearFacingBabySeatCount',
        'additionalStops',
    ]);
    const childSeatFee = priceOptions.childSeatFee;
    const additionalStopFee = isHourly ? Number(0) : priceOptions.additionalStopFee;

    let carSeatCount = [boosterSeatCount, forwardFacingBabySeatCount, rearFacingBabySeatCount]
        .filter(Boolean)
        .reduce((acc, v) => acc + Number(v), 0);
    if (vehicleClass.isFirstChildSeatFree) {
        carSeatCount = Math.max(0, carSeatCount - 1);
    }
    let subTotal = 0;
    if (requiresWeddingRibbons) {
        subTotal += Number(priceOptions.weddingRibbonFee);
    }
    if (vehicleColorId) {
        subTotal += Number(priceOptions.colorSelectionFee);
    }
    if (carSeatCount) {
        subTotal += carSeatCount * Number(childSeatFee);
    }
    if (additionalStops) {
        subTotal += additionalStops.length * Number(additionalStopFee);
    }

    const total = currentPrice.getPriceWithoutOptions() + subTotal;

    // Go to the server to refresh the price with additional stops - we need this because
    // the price algorithm incorporates the additional distance involved, which can't be
    // handled from the frontend
    // Note that any parameters set in this step must be included in the parameters to
    // props.onSubmit in order to be sent to the server - nothing from this step is included
    // by default
    useEffect(() => {
        const mayRefresh =
            props.onSubmit &&
            (!additionalStops ||
                additionalStops.reduce(
                    (areAllStopsValid, thisStop) =>
                        areAllStopsValid && thisStop && thisStop.isValidAddress,
                    true
                ));
        if (mayRefresh) {
            props.onSubmit({ goToNext: false, additionalStops, ignoreErrors: true });
        }
    }, [additionalStops]); // eslint-disable-line react-hooks/exhaustive-deps

    const AddNewButton = ({ onAdd, canAdd }) =>
        canAdd && (
            <Row>
                <button className={styles.addDestinationBtn} type="button" onClick={onAdd}>
                    <span aria-disabled="true">
                        <IconPlus />
                    </span>
                    Add additional stop
                </button>
            </Row>
        );

    const removeButton = ({ onRemove, canRemove }) =>
        canRemove && (
            <Button type="link" onClick={onRemove}>
                Clear
            </Button>
        );
    const { passenger } = bookingContext.data;
    const { addressBook, canAddAddress, addressClientId } = useAddressBook({ passenger });
    return (
        <div className={styles.optionWrapper}>
            <ScbpModelForm {...props} layout="vertical">
                {headerBar && headerBar}
                <fieldset>
                    <legend>
                        Additional stops on route
                        <span className={styles.price}>
                            <span className={styles.priceSubText}>
                                Price based on additional kilometres
                            </span>
                            {additionalStopFee > 0 && (
                                <span className={styles.priceSubText}>
                                    + {formatAuCurrency(additionalStopFee)} per stop
                                </span>
                            )}
                        </span>
                    </legend>
                    <Row>
                        <Col lg={{ span: 22, offset: 1 }}>
                            <ScbpModelForm.Item>
                                <ScbpModelForm.Field
                                    reduxFormFieldComponent={FieldArray}
                                    name="additionalStops"
                                    widget={
                                        <ListWidget
                                            max={5}
                                            defaultValue={{
                                                formattedAddress: '',
                                            }}
                                            renderItem={(fieldName, pps) => (
                                                <div
                                                    className={styles.additionalStopField}
                                                    data-testid={`additional-stop-${pps.index + 1}`}
                                                >
                                                    <ListItemWidget
                                                        renderButton={() => null}
                                                        {...pps}
                                                        inputWidget={
                                                            <BookingAddressCapture
                                                                size="large"
                                                                allowPickupOption
                                                                formName={props.name}
                                                                addressTypeFieldName={`${fieldName}.addressType`}
                                                                addressFieldName={fieldName}
                                                                addresses={addressBook}
                                                                canAddAddress={canAddAddress}
                                                                currentUserId={addressClientId}
                                                                compact
                                                                addressLookupChildren={removeButton(
                                                                    pps
                                                                )}
                                                            />
                                                        }
                                                    />
                                                    <Row>
                                                        <ScbpModelForm.Field
                                                            className={styles.addressInstructions}
                                                            name={`${fieldName}.addressInstructions`}
                                                            isUserDefinedField
                                                            placeholder="Instructions for this address"
                                                        />
                                                    </Row>
                                                </div>
                                            )}
                                            renderAddNewButton={AddNewButton}
                                        />
                                    }
                                />
                                {/* Hack to make errors show for additional stops when we have 0 stops added but a generic error message (eg. hourly bookings require additional stops) */}
                                <FormField name="additionalStops[0]" widget={() => null} />
                            </ScbpModelForm.Item>
                        </Col>
                    </Row>
                </fieldset>
                <fieldset className={`${styles.childSeats} ${styles.optionsSection}`}>
                    <legend>
                        Child seats
                        <span className={styles.price}>
                            {formatAuCurrency(childSeatFee)}
                            <span className={styles.priceSubText}>per seat</span>
                        </span>
                        {vehicleClass.isFirstChildSeatFree && (
                            <span className={styles.subText}>
                                First seat free with {vehicleClass.title}
                            </span>
                        )}
                        <span className={styles.subText}>
                            Please note that it is mandatory for all children under 8 to have a
                            child seat
                        </span>
                    </legend>
                    <ScbpModelForm.Item>
                        <Row type="flex" justify="space-between" className={styles.seats}>
                            <label>
                                <IconBooster />
                                <span className={styles.seatName}>Booster seats</span>
                                <ScbpModelForm.Field
                                    name="boosterSeatCount"
                                    widget={
                                        <NumericChoicesWidget max={childSeatLimit} size="large" />
                                    }
                                />
                            </label>
                            <label>
                                <IconForwardFacing />
                                <span className={styles.seatName}>Forward facing baby seat</span>
                                <ScbpModelForm.Field
                                    name="forwardFacingBabySeatCount"
                                    widget={
                                        <NumericChoicesWidget max={childSeatLimit} size="large" />
                                    }
                                />
                            </label>
                            <label>
                                <IconRearFacing />
                                <span className={styles.seatName}>Rear facing baby seat</span>
                                <ScbpModelForm.Field
                                    name="rearFacingBabySeatCount"
                                    widget={
                                        <NumericChoicesWidget max={childSeatLimit} size="large" />
                                    }
                                />
                            </label>
                        </Row>
                    </ScbpModelForm.Item>
                </fieldset>
                {!isInterstate && (
                    <fieldset className={`${styles.vehicleColours} ${styles.optionsSection}`}>
                        <legend>
                            Custom vehicle colour
                            <span className={styles.price}>
                                {formatAuCurrency(priceOptions.colorSelectionFee)}
                            </span>
                            <span className={styles.subText}>
                                If you do not choose a particular colour, either colour will be
                                selected for you.
                            </span>
                        </legend>
                        <ScbpModelForm.Item name="vehicleColorId" label={null}>
                            <ScbpModelForm.Field
                                name="vehicleColorId"
                                widget={
                                    <ColorSelector
                                        showClear
                                        options={vehicleClass.availableColors
                                            .map(color => ({
                                                id: color.getId(),
                                                colorName: color.title,
                                                colorValue: color.colorCode,
                                                label: color.title,
                                            }))
                                            .toArray()}
                                    />
                                }
                            />
                        </ScbpModelForm.Item>
                    </fieldset>
                )}
                {!isInterstate && (
                    <fieldset className={`${styles.weddingRibbon} ${styles.optionsSection}`}>
                        <legend>
                            Wedding ribbon
                            <span className={styles.price}>
                                {formatAuCurrency(priceOptions.weddingRibbonFee)}
                                <span className={styles.priceSubText}>flat fee</span>
                            </span>
                        </legend>
                        <ScbpModelForm.Item>
                            <span className={styles.ribbon}>
                                <IconRibbon />
                            </span>
                            <ScbpModelForm.Field
                                name="requiresWeddingRibbons"
                                widget={<CheckboxWidget>Add</CheckboxWidget>}
                            />
                        </ScbpModelForm.Item>
                    </fieldset>
                )}
                <PriceSummaryBar
                    subTotal={subTotal}
                    subTotalLabel="Optional Extras Total:"
                    total={total}
                />
            </ScbpModelForm>
        </div>
    );
}

CreateBookingOptionsForm.propTypes = {
    bookingContext: BookingPropTypes.bookingContext.isRequired,
    headerBar: PropTypes.node,
    name: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
    refreshPrice: PropTypes.func,
};
