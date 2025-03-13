import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Button, Col, Row } from 'antd';
import SwitchWidget from '@alliance-software/djrad/components/form/widgets/SwitchWidget';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useFormValues from '@alliance-software/djrad/hooks/useFormValues';
import { RangeReduxFormField } from '@alliance-software/djrad/model/fields/RangeField';
import DateRangeSplitWidget from '../../../common/form/DateRangeSplitWidget';

import BookingStatusSelect from './BookingStatusSelect';
import { DispatchBooking } from '../models';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';

import styles from '../dispatch.less';

function DispatchFilterDateRangeWidget({ onRelativeDateChange, ...rest }) {
    return (
        <div className={styles.dateRangeFilter}>
            <Button
                className={styles.listFilterGridComponent}
                icon="left"
                onClick={onRelativeDateChange(-1)}
            />
            <div>
                <DateRangeSplitWidget className={styles.listFilterGridComponent} {...rest} />
            </div>
            <Button
                className={styles.listFilterGridComponent}
                icon="right"
                onClick={onRelativeDateChange(1)}
            />
        </div>
    );
}

DispatchFilterDateRangeWidget.propTypes = {
    /**
     * Required function definition:
     * onRelativeDateChange(number.isRequired) -> eventHandler
     * **/
    onRelativeDateChange: PropTypes.func.isRequired,
};

function DispatchFilterFormFooter({ isLoading, refresh }) {
    const rightButtons = [
        <ScbpModelFilterForm.Button
            type="primary"
            key="refresh"
            loading={isLoading}
            onClick={refresh}
        >
            Refresh
        </ScbpModelFilterForm.Button>,
    ];
    return <div>{rightButtons}</div>;
}

DispatchFilterFormFooter.propTypes = {
    isLoading: PropTypes.bool,
    refresh: PropTypes.func.isRequired,
};

export default function DispatchFilterForm({ formName, refresh, extraData, isLoading, ...props }) {
    const dateRangeFormat = 'YYYY-MM-DD';
    const formActions = useFormActions(formName);
    const fieldValues = useFormValues(formName, ['travelDate']);

    const onRelativeDateChange = numDays => () => {
        const newFieldValues = {
            lower: moment(fieldValues.lower)
                .add(numDays, 'days')
                .format(dateRangeFormat),
            upper: moment(fieldValues.upper)
                .add(numDays, 'days')
                .format(dateRangeFormat),
        };
        formActions.change('travelDate', newFieldValues);
    };

    return (
        <ScbpModelFilterForm
            name={formName}
            model={DispatchBooking}
            layout="inline"
            onChange={formActions.submit}
            footer={null}
            className={styles.filterForm}
            {...props}
        >
            <fieldset>
                <Row>
                    <Col span={12}>
                        <div className={styles.dateRangeFilterField}>
                            <ScbpModelFilterForm.Item label="Date" colon={false} name="travelDate">
                                <ScbpModelFilterForm.Field
                                    name="travelDate"
                                    reduxFormFieldComponent={RangeReduxFormField}
                                    widget={DispatchFilterDateRangeWidget}
                                    widgetProps={{ onRelativeDateChange }}
                                />
                            </ScbpModelFilterForm.Item>
                        </div>
                    </Col>
                    <Col span={6}>
                        <ScbpModelFilterForm.Item
                            name="interstate"
                            label={false}
                            fullWidth
                            className={styles.interstateField}
                        >
                            <label className={styles.listFilterCheckboxLabel} htmlFor="interstate">
                                Display Interstate
                            </label>
                            <ScbpModelFilterForm.Field
                                name="interstate"
                                widget={SwitchWidget}
                                widgetProps={{ label: 'Display Interstate' }}
                            />
                        </ScbpModelFilterForm.Item>
                    </Col>
                    <Col span={6} className={styles.filterRhsItems}>
                        {extraData && (
                            <span className={styles.bookingCounts}>
                                {extraData.filteredBookingCount} / {extraData.rangeBookingCount}
                                {' bookings'}
                            </span>
                        )}
                        <ScbpModelFilterForm.Item>
                            <DispatchFilterFormFooter
                                isLoading={isLoading}
                                submit={formActions.submit}
                                refresh={refresh}
                            />
                        </ScbpModelFilterForm.Item>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <ScbpModelFilterForm.Item name="bookingStatus" label={false}>
                            <ScbpModelFilterForm.Field
                                name="bookingStatus"
                                widget={BookingStatusSelect}
                            />
                        </ScbpModelFilterForm.Item>
                    </Col>
                </Row>
            </fieldset>
        </ScbpModelFilterForm>
    );
}

DispatchFilterForm.propTypes = {
    formName: PropTypes.string.isRequired,
    refresh: PropTypes.func.isRequired,
    extraData: PropTypes.object,
    isLoading: PropTypes.bool,
};
