import React from 'react';
import { Col, Row } from 'antd';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import { DriverUser } from '../../../common/user/models';

const { Item } = ScbpModelFilterForm;

export default function DriverUserFilterForm(props) {
    return (
        <ScbpModelFilterForm
            model={DriverUser}
            layout="vertical"
            {...props}
            initialValues={{ isActive: true }}
        >
            <Row>
                <Col sm={10}>
                    <Item name="name" />
                </Col>
                <Col sm={{ span: 10, offset: 1 }}>
                    <Item name="email" />
                </Col>
            </Row>
            <Row>
                <Col sm={{ span: 10 }}>
                    <Item name="isActive" />
                </Col>
            </Row>
        </ScbpModelFilterForm>
    );
}
