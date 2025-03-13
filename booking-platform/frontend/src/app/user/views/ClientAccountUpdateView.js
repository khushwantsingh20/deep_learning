import { message, Col, Row, Spin } from 'antd';
import React from 'react';
import useGetModel from '@alliance-software/djrad/hooks/useGetModel';
import ClientAccountFormProcessor from '../components/ClientAccountFormProcessor';
import { Account } from '../models';

import styles from './ClientAccountCreateView.less';

function ClientAccountUpdateView({ history, match }) {
    const { params } = match;
    const { record, isLoading } = useGetModel(Account, params.id, {});
    const onSuccess = () => {
        message.success('Account successfully updated');
        history.push(Account.getActionUrl('list'));
    };
    if (isLoading) {
        return <Spin />;
    }

    return (
        <div className="container">
            <Row>
                <Col lg={{ span: 16, offset: 4 }}>
                    <section className={styles.createAccount}>
                        <h1>Update a billing account</h1>
                        <ClientAccountFormProcessor onSuccess={onSuccess} record={record} />
                    </section>
                </Col>
            </Row>
        </div>
    );
}

export default ClientAccountUpdateView;
