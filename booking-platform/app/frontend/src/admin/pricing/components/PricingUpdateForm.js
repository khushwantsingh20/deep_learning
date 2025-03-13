import PropTypes from 'prop-types';
import ButtonBar from '@alliance-software/djrad/components/form/ButtonBar';
import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import React from 'react';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import DateWidget from '../../../common/form/DateWidget';

function PricingUpdateForm({ future, record, onSuccess }) {
    const { formProps } = useModelFormProcessor({
        record,
        onSuccess,
    });

    const onValidate = data => {
        const errors = {};
        if (future && !data.scheduledFrom) {
            errors.scheduledFrom =
                'You must provide a date for when this price list will take effect.';
        }

        return errors;
    };

    const footer = (
        <ButtonBar
            rightButtons={
                <ScbpModelForm.Button type="primary" htmlType="submit">
                    Save
                </ScbpModelForm.Button>
            }
        />
    );

    return (
        <ScbpModelForm footer={footer} {...formProps} validate={data => onValidate(data)}>
            {future && <ScbpModelForm.Item name="scheduledFrom" widget={DateWidget} />}
            <ScbpModelForm.Item name="rateScheduleStandard" />
            <ScbpModelForm.Item name="rateScheduleRetail" />
            <ScbpModelForm.Item name="rateScheduleCorporate" />
            <ScbpModelForm.Item name="rateScheduleInstitution" />
            <ScbpModelForm.Item name="hourlyInitialFee" />
            <ScbpModelForm.Item name="hourlyTier1StartAt" />
            <ScbpModelForm.Item name="hourlyTier2StartAt" />
            <ScbpModelForm.Item name="blockSizeMinutes" />
            <ScbpModelForm.Item name="hourlyTier1RatePerBlock" />
            <ScbpModelForm.Item name="hourlyTier2RatePerBlock" />
            <ScbpModelForm.Item name="outOfAreaBoundaryKm" />
            <ScbpModelForm.Item name="interstateFee" />
            <ScbpModelForm.Item name="airportSurcharge" />
            <ScbpModelForm.Item name="airportParkingFee" />
            <ScbpModelForm.Item name="governmentBookingFee" />
            <ScbpModelForm.Item name="companyBookingFee" />
            <ScbpModelForm.Item name="offPeakDiscountPercentage" />
            <ScbpModelForm.Item name="peakPercent" />
            <ScbpModelForm.Item name="peakMaxAmount" />
            <ScbpModelForm.Item name="outOfHoursFee" />
            <ScbpModelForm.Item name="publicHolidayFee" />
            <ScbpModelForm.Item name="publicHolidayOutOfHoursFee" />
            <ScbpModelForm.Item name="offPeakMinimumFee" />
            <ScbpModelForm.Item name="standardMinimumFee" />
            <ScbpModelForm.Item name="saturdayNightMinimumFee" />
            <ScbpModelForm.Item name="weddingRibbonFee" />
            <ScbpModelForm.Item name="childSeatFee" />
            <ScbpModelForm.Item name="additionalStopFee" />
            <ScbpModelForm.Item name="colorSelectionFee" />
            <ScbpModelForm.Item name="carParkPassFee" />
        </ScbpModelForm>
    );
}

PricingUpdateForm.propTypes = {
    future: PropTypes.bool,
    record: modelInstance(),
    onSuccess: PropTypes.func.isRequired,
};

export default PricingUpdateForm;
