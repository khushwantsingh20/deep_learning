import React from 'react';
import { Col, Row } from 'antd';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import { StaffUser } from '../models';

const { Item } = ScbpModelFilterForm;

export default function StaffUserFilterForm(props) {
    return (
        <ScbpModelFilterForm
            model={StaffUser}
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
                <Col sm={{ span: 5 }}>
                    <Item name="userType" />
                </Col>
                <Col sm={{ span: 5, offset: 1 }}>
                    <Item name="dateJoined" />
                </Col>
                <Col sm={{ span: 5, offset: 1 }}>
                    <Item name="isActive" />
                </Col>
            </Row>
        </ScbpModelFilterForm>
    );
}
