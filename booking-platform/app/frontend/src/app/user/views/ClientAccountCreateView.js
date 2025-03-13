import { message, Col, Row } from 'antd';
import React from 'react';
import ClientAccountFormProcessor from '../components/ClientAccountFormProcessor';

import styles from './ClientAccountCreateView.less';

function ClientAccountCreateView({ history }) {
    const onSuccess = () => {
        message.success('Account successfully added');
        history.push('/');
    };
    return (
        <div className="container">
            <Row>
                <Col lg={{ span: 16, offset: 4 }}>
                    <section className={styles.createAccount}>
                        <div className="mainContent">
                            <h1>Create a billing account</h1>
                            <ClientAccountFormProcessor onSuccess={onSuccess} />
                        </div>
                    </section>
                </Col>
            </Row>
        </div>
    );
}

export default ClientAccountCreateView;
