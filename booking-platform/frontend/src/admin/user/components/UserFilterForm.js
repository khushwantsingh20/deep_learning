import CheckPermission from '@alliance-software/djrad/components/permissions/CheckPermission';
import React from 'react';
import { Col, Row } from 'antd';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';
import { User } from '../models';

const { Item } = ScbpModelFilterForm;

export default function UserFilterForm(props) {
    return (
        <ScbpModelFilterForm
            model={User}
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
            <CheckPermission perm="is_superuser">
                {({ hasPerm, isLoading }) => {
                    if (isLoading) {
                        return null;
                    }
                    return (
                        <Row>
                            <Col sm={!hasPerm ? 10 : 6}>
                                <Item name="dateJoined" />
                            </Col>
                            <Col sm={{ span: !hasPerm ? 10 : 4, offset: 1 }}>
                                <Item name="isActive" />
                            </Col>
                            {hasPerm && (
                                <>
                                    <Col sm={{ span: 4, offset: 1 }}>
                                        <Item name="isSuperuser" />
                                    </Col>
                                </>
                            )}
                        </Row>
                    );
                }}
            </CheckPermission>
        </ScbpModelFilterForm>
    );
}
