import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Modal, Button, Spin, Table } from 'antd';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import { BookingLog } from '../models';

function BookingLogTable({ logs }) {
    const columns = [
        { title: 'User', dataIndex: 'user', key: 'user' },
        { title: 'Source', dataIndex: 'source', key: 'source' },
        { title: 'Time', dataIndex: 'createdAt', key: 'createdAt' },
    ];

    return (
        <div>
            <Table
                columns={columns}
                expandRowByClick
                expandedRowRender={record => (
                    <>
                        {record.description.split('\n').map(text => (
                            <p style={{ margin: 0 }}>{text}</p>
                        ))}
                    </>
                )}
                dataSource={logs.toJS()}
                rowKey="id"
            />
        </div>
    );
}

BookingLogTable.propTypes = {
    logs: PropTypes.array.isRequired,
};

export default function BookingLogModal({ booking }) {
    const [showModal, setShowModal] = useState(false);

    const { records, isLoading, run } = useListModel(
        BookingLog,
        {
            booking,
        },
        {
            trigger: useListModel.MANUAL,
        }
    );

    const showLog = () => {
        run();
        setShowModal(true);
    };

    return (
        <>
            <Button onClick={showLog}>View Logs</Button>

            <Modal
                title="Booking Logs"
                visible={showModal}
                footer={null}
                onCancel={() => setShowModal(false)}
                width="40%"
            >
                {isLoading && <Spin />}
                {!isLoading && <BookingLogTable logs={records || []} />}
            </Modal>
        </>
    );
}

BookingLogModal.propTypes = {
    booking: PropTypes.number.isRequired,
};
