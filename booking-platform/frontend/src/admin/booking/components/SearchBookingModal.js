import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Modal, Button } from 'antd';

import { Booking } from '../models';
import useListView from '../../../common/hooks/useListView';
import ScbpListTableView from '../../../common/data/ScbpListTableView';
import ScbpModelFilterForm from '../../../common/data/ScbpModelFilterForm';

export default function SearchBookingModal(props) {
    const [showModal, setShowModal] = useState(false);
    const { tableProps, filterProps } = useListView(Booking, null, {
        refetchOn: ['add', 'delete'],
        syncUrl: false,
    });

    const columns = [
        'bookingNumber',
        'travelOn',
        'passengerFullname',
        {
            dataIndex: 'fromAddress',
            render(value) {
                return value.formattedAddress;
            },
        },
        {
            dataIndex: 'destinationAddress',
            render(value) {
                return value ? value.formattedAddress : '';
            },
        },
        {
            dataIndex: 'id',
            title: '',
            render(value) {
                return (
                    <Button
                        onClick={() => {
                            props.setBooking(value);
                            setShowModal(false);
                        }}
                    >
                        Pick
                    </Button>
                );
            },
        },
    ];

    return (
        <>
            <Button onClick={() => setShowModal(true)}>Search Booking</Button>

            <Modal
                title="Find Booking"
                visible={showModal}
                onCancel={() => setShowModal(false)}
                width={1200}
            >
                <ScbpModelFilterForm model={Booking} layout="horizontal" {...filterProps} />
                <ScbpListTableView {...tableProps} columns={columns} />
            </Modal>
        </>
    );
}

SearchBookingModal.propTypes = {
    setBooking: PropTypes.func.isRequired,
};
