import PropTypes from 'prop-types';
import React from 'react';
import { modelClass, modelInstance } from '@alliance-software/djrad/prop-types/model';
import { Row, Col } from 'antd';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import AddressLookupWidget from '../../../common/form/AddressLookupWidget';

const { Item } = ScbpModelForm;

export default function DriverUserForm(props) {
    const initialValues = props.record
        ? { ...props.record.toJS(), address: { formattedAddress: props.record.address } }
        : null;

    const handleSubmit = ({ address: adr, ...data }) =>
        props.onSubmit({
            ...data,
            address: adr ? adr.formattedAddress : '',
        });

    return (
        <ScbpModelForm
            layout="vertical"
            {...props}
            initialValues={initialValues}
            onSubmit={handleSubmit}
        >
            <Row gutter={30}>
                <Col span={12}>
                    <Item name="title" />
                    <Item name="firstName" />
                    <Item name="lastName" />
                </Col>
                <Col span={12}>
                    <Item name="email" fieldProps={{ autoComplete: 'email' }} />
                    <Item name="currentVehicle" />
                </Col>
            </Row>

            <hr />
            <Row gutter={30}>
                <Col span={12}>
                    <Item name="driverNo" />
                    <Item name="homePhone" />
                    <Item name="mobile" />
                    <Item name="dateOfBirth" />
                    <Item label="Address">
                        <ScbpModelForm.Field name="address" widget={AddressLookupWidget} />
                    </Item>
                    <Item name="partnerName" />
                    <Item name="partnerPhone" />
                    <Item name="commisionRate" label="Commision Rate %" />
                    <Item name="hasDriverAgreementSigned" />
                    <Item name="abn" label="ABN" />
                    <Item name="isAbnVerified" label="ABN Verified" />
                </Col>
                <Col span={12}>
                    <Item name="startDate" />
                    <Item name="endDate" />
                    <Item name="driversLicenseNumber" />
                    <Item name="driversLicenseExpiryDate" />
                    <Item name="driverCertificateNumber" />
                    <Item name="driverCertificateExpiryDate" />
                    <Item name="operationsManualNumber" />
                    <Item name="operationsManualVersion" />
                    <Item name="operationsManualIssuedDate" />
                    <Item name="operationsManualReturnedDate" />
                </Col>
            </Row>
        </ScbpModelForm>
    );
}

DriverUserForm.propTypes = {
    model: modelClass(['scbp_core.driveruser']),
    record: modelInstance(['scbp_core.driveruser']),
    onSubmit: PropTypes.func.isRequired,
};
