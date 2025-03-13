import React from 'react';
import { Row, Col } from 'antd';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';

import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { Vehicle } from '../models';
import ArchiveSaveFooter from '../../../common/components/ArchiveSaveFooter';

export default function VehicleForm(props) {
    return (
        <ScbpModelForm
            layout="vertical"
            footer={<ArchiveSaveFooter record={props.record} model={Vehicle} />}
            {...props}
        >
            <Row gutter={30}>
                <Col span={12}>
                    <ScbpModelForm.Item name="carNo" />
                    <ScbpModelForm.Item name="commericalPassengerVehicleLicense" />
                </Col>
                <Col span={12}>
                    <ScbpModelForm.Item
                        name="vehicleOperator"
                        fieldProps={{ showAdd: false, showUpdate: false }}
                    />
                </Col>
            </Row>
            <hr />
            <Row gutter={30}>
                <Col span={12}>
                    <ScbpModelForm.Item name="make" />
                    <ScbpModelForm.Item name="model" />
                    <ScbpModelForm.Item
                        name="carClass"
                        fieldProps={{ showAdd: false, showUpdate: false }}
                    />
                    <ScbpModelForm.Item name="inspectionDate" />
                </Col>
                <Col span={12}>
                    <ScbpModelForm.Item
                        name="color"
                        label="Colour"
                        fieldProps={{ showAdd: false, showUpdate: false }}
                    />
                    <ScbpModelForm.Item name="yearOfManufacture" />
                    <ScbpModelForm.Item name="odometer" />
                    <ScbpModelForm.Item name="radioSerialNo" />
                </Col>
            </Row>
        </ScbpModelForm>
    );
}

VehicleForm.propTypes = {
    record: modelInstance(),
};
