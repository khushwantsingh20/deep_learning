import ModelLookupWidget from '@alliance-software/djrad/components/form/widgets/ModelLookupWidget';
import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import { Col, Row } from 'antd';
import React, { useEffect } from 'react';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { numeric } from '../../../common/prop-types';
import NumericChoicesWidget from '../../../common/ui/NumericChoicesWidget';
import { DriverUser } from '../../../common/user/models';
import { VehicleClass } from '../../vehicle/models';
import BookingPanel from './BookingEntryPanel';
import BookingValueWidget from './BookingValueWidget';

const { Item } = ScbpModelForm;

export default function BookingOptionalExtrasPanel({ vehicleClassId }) {
    const { record: vehicleClass, run } = useGetModel(VehicleClass, vehicleClassId, {
        partialRecordFieldNames: ['maxChildSeatCount'],
        trigger: useGetModel.MANUAL,
    });
    useEffect(() => {
        // vehicleClassId could be null so we manually fetch it when it's available
        if (vehicleClassId) {
            run();
        }
    }, [run, vehicleClassId]);
    const childSeatLimit = vehicleClass ? vehicleClass.maxChildSeatCount : 1;
    const seatWidget = (
        <BookingValueWidget
            widget={<NumericChoicesWidget max={childSeatLimit} style={{ width: 100 }} />}
        />
    );
    return (
        <BookingPanel label="Optional Extras">
            <Row gutter={30}>
                <Col span={6}>
                    <Item name="vehicleClass" fieldProps={{ showAdd: false, showUpdate: false }} />
                </Col>
                <Col span={6}>
                    <Item name="vehicleColor" fieldProps={{ showAdd: false, showUpdate: false }} />
                </Col>
                <Col span={6}>
                    <Item name="requestedDriver">
                        <ScbpModelForm.Field
                            name="requestedDriver"
                            widget={ModelLookupWidget}
                            widgetProps={{
                                model: DriverUser,
                                labelFieldName: 'dispatchLabel',
                                allowClear: true,
                                baseFilter: { isActive: true },
                            }}
                        />
                    </Item>
                </Col>
            </Row>
            <Row>
                <Col span={3}>
                    <Item name="boosterSeatCount" label="Booster Seat" widget={seatWidget} />
                </Col>
                <Col span={3}>
                    <Item
                        name="rearFacingBabySeatCount"
                        label="Rear Facing Seat"
                        widget={seatWidget}
                    />
                </Col>
                <Col span={4}>
                    <Item
                        name="forwardFacingBabySeatCount"
                        label="Forward Facing Seat"
                        widget={seatWidget}
                    />
                </Col>
                <Col span={3}>
                    <Item
                        name="requiresWeddingRibbons"
                        label="Ribbon"
                        fieldProps={{
                            style: { width: 100 },
                        }}
                    />
                </Col>
                <Col span={3}>
                    <Item
                        name="requiresCarParkPass"
                        label="BHP Pass"
                        fieldProps={{
                            style: { width: 100 },
                        }}
                    />
                </Col>
            </Row>
        </BookingPanel>
    );
}

BookingOptionalExtrasPanel.propTypes = {
    vehicleClassId: numeric,
};
