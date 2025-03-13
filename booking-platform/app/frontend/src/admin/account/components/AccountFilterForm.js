import React from 'react';
import { Col, Row } from 'antd';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import { Account } from '../../../common/user/models';

const { Item } = ScbpModelFilterForm;

export default function AccountFilterForm(props) {
    return (
        <ScbpModelFilterForm model={Account} layout="vertical" {...props}>
            <Row>
                <Col sm={{ span: 10 }}>
                    <Item name="accountNo" />
                    <Item name="isArchived" />
                </Col>
                <Col sm={{ span: 10, offset: 1 }}>
                    <Item name="accountNickname" />
                </Col>
            </Row>
        </ScbpModelFilterForm>
    );
}
