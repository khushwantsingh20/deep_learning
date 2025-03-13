import PropTypes from 'prop-types';
import React from 'react';
import { Row, Col } from 'antd';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';

import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { VehicleOperator } from '../models';
import AddressLookupWidget from '../../../common/form/AddressLookupWidget';
import ArchiveSaveFooter from '../../../common/components/ArchiveSaveFooter';

export default function VehicleOperatorForm(props) {
    const initialValues = props.record
        ? { ...props.record.toJS(), address: { formattedAddress: props.record.address } }
        : null;

    const handleSubmit = ({ address: adr, ...data }) =>
        props.onSubmit({
            ...data,
            address: adr ? adr.formattedAddress : '',
            lat: adr ? adr.lat : 0,
            long: adr ? adr.long : 0,
        });

    return (
        <ScbpModelForm
            layout="vertical"
            footer={<ArchiveSaveFooter record={props.record} model={VehicleOperator} />}
            validate={data => {
                if (!data.address || !data.address.isValidAddress) {
                    return { address: 'Please select a valid address' };
                }
                return {};
            }}
            {...props}
            initialValues={initialValues}
            onSubmit={handleSubmit}
        >
            <Row gutter={30}>
                <Col span={12}>
                    <ScbpModelForm.Item name="vehicleOperatorNo" />
                    <ScbpModelForm.Item name="companyName" />
                    <ScbpModelForm.Item label="Address">
                        <ScbpModelForm.Field name="address" widget={AddressLookupWidget} />
                    </ScbpModelForm.Item>
                </Col>
                <Col span={12}>
                    <ScbpModelForm.Item name="abn" label="ABN" />
                    <ScbpModelForm.Item name="isAbnVerified" label="ABN Verified" />
                </Col>
            </Row>
            <hr />
            <Row gutter={30}>
                <Col span={12}>
                    <ScbpModelForm.Item name="contactTitle" />
                    <ScbpModelForm.Item name="contactFirstName" />
                    <ScbpModelForm.Item name="contactLastName" />
                    <ScbpModelForm.Item name="classification" />
                </Col>
                <Col span={12}>
                    <ScbpModelForm.Item name="contactPhone" />
                    <ScbpModelForm.Item name="contactMobile" />
                    <ScbpModelForm.Item name="contactEmail" />
                </Col>
            </Row>
            <hr />
            <Row gutter={30}>
                <Col span={12}>
                    <ScbpModelForm.Item name="hasAgreementWithSc" label="Agreement With SC" />
                    <ScbpModelForm.Item name="renewalDate" />
                    <ScbpModelForm.Item name="agreementDate" />
                </Col>
                <Col span={12}>
                    <ScbpModelForm.Item name="serviceFeePercent" />
                    <ScbpModelForm.Item name="marketingLevy" />
                    <ScbpModelForm.Item name="monthlyDepotFee" />
                </Col>
            </Row>
            <hr />
            <Row gutter={30}>
                <Col span={12}>
                    <ScbpModelForm.Item name="bankName" />
                    <ScbpModelForm.Item name="bankAccountName" />
                </Col>
                <Col span={12}>
                    <ScbpModelForm.Item name="bankBsb" label="Bank BSB" />
                    <ScbpModelForm.Item name="bankAccountNumber" />
                </Col>
            </Row>
            {props.record && props.record.vehicles && (
                <>
                    <h3>Associated Vehicles:</h3>
                    {props.record.vehicles.map(v => (
                        <div key={v}>{v}</div>
                    ))}
                </>
            )}
        </ScbpModelForm>
    );
}

VehicleOperatorForm.propTypes = {
    record: modelInstance(),
    onSubmit: PropTypes.func.isRequired,
};
