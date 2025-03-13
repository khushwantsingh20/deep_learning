import React from 'react';
import { Col, Row } from 'antd';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import { ClientUser } from '../../user/models';

const { Item } = ScbpModelFilterForm;

export default function ClientUserFilterForm(props) {
    return (
        <ScbpModelFilterForm
            model={ClientUser}
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
                <Col sm={{ span: 10 }}>
                    <Item name="isActive" />
                </Col>
                <Col sm={{ span: 10, offset: 1 }}>
                    <Item name="contactPhone" label="Contact Phone" />
                </Col>
            </Row>
        </ScbpModelFilterForm>
    );
}
