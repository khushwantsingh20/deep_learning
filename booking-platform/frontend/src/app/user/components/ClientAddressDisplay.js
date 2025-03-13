import { Col, List, Row } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import styles from '../views/UserProfileView.less';

export default function ClientAddressDisplay({ item }) {
    return (
        <Row style={{ width: '100%' }}>
            <Col span={item.instructions ? 18 : 24}>
                <List.Item.Meta title={item.title} description={item.description} />
            </Col>
            {item.instructions && (
                <Col span={6}>
                    <List.Item.Meta
                        className={styles.addressInstruction}
                        title={<span className={styles.instructionTitle}>Instructions</span>}
                        description={item.instructions}
                    />
                </Col>
            )}
        </Row>
    );
}

ClientAddressDisplay.propTypes = {
    item: PropTypes.object.isRequired,
};
