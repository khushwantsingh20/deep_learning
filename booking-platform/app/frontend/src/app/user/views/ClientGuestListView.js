import PropTypes from 'prop-types';
import { deleteModel } from '@alliance-software/djrad/actions';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import useFormActions from '@alliance-software/djrad/hooks/useFormActions';
import useListModel from '@alliance-software/djrad/hooks/useListModel';
import useModelFormProcessor from '@alliance-software/djrad/hooks/useModelFormProcessor';
import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import { Button, Popconfirm, message, Skeleton, Modal } from 'antd';
import React, { useState } from 'react';
import ScbpModelForm from '../../../common/data/ScbpModelForm';
import { GuestTraveller } from '../../booking/models';
import List from '../../components/List';
import { useCurrentUser } from '../hooks';
import styles from './UserProfileView.less';

function CreateEditButton({ record, children, type = 'primary' }) {
    const [showModal, setShowModal] = useState(false);
    const formName = `edit-guest-traveller-${record ? record.getId() : '-new'}`;
    const formActions = useFormActions(formName);
    const { formProps, isSubmitting } = useModelFormProcessor({
        record,
        model: GuestTraveller,
        onSuccess: () => {
            formActions.reset();
            setShowModal(false);
            message.success(record ? 'Guest traveller updated' : 'Guest traveller created');
        },
        formName,
    });

    return (
        <>
            <Modal
                visible={showModal}
                onCancel={() => {
                    formActions.reset();
                    setShowModal(false);
                }}
                onOk={() => formActions.submit()}
                title="Edit Guest Traveller"
                okText="Save"
                okButtonProps={{
                    loading: isSubmitting,
                }}
                cancelButtonProps={{
                    disabled: isSubmitting,
                }}
            >
                <ScbpModelForm name={formName} {...formProps} footer={null}>
                    <ScbpModelForm.Item name="name" />
                    <ScbpModelForm.Item name="phoneNumber" />
                    <ScbpModelForm.Button htmlType="primary" style={{ display: 'none' }} />
                </ScbpModelForm>
            </Modal>
            <Button type={type} onClick={() => setShowModal(true)} style={{ marginRight: 10 }}>
                {children}
            </Button>
        </>
    );
}

CreateEditButton.propTypes = {
    record: modelInstance('scbp_core.guesttraveller').isRequired,
    type: PropTypes.string,
};

function DeleteButton({ record }) {
    const { isLoading: isDeleting, run } = useAsyncRedux(deleteModel, { args: [record] });

    const onSuccess = () => message.success('Guest deleted');
    const onError = () => message.error('There was an unexpected problem... please try again');

    return (
        <Popconfirm
            disabled={isDeleting}
            title="Are you sure you want to delete this guest?"
            onConfirm={() => run().then(onSuccess, onError)}
            okText="Yes"
            cancelText="No"
        >
            <Button type="danger">Delete</Button>
        </Popconfirm>
    );
}

DeleteButton.propTypes = {
    record: modelInstance('scbp_core.guesttraveller').isRequired,
};

export default function ClientGuestListView() {
    const user = useCurrentUser();
    const { records, isLoading } = useListModel('scbp_core.guesttraveller', {
        clientUser: user.id,
    });
    if (isLoading) {
        return <Skeleton />;
    }
    return (
        <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 className={`${styles.actionHeading} h3`}>Guest List</h2>
                <CreateEditButton type="secondary" size="small">
                    Add Guest
                </CreateEditButton>
            </div>
            <List>
                {records.map(record => (
                    <List.Item
                        actions={[
                            <CreateEditButton record={record}>Edit</CreateEditButton>,
                            <DeleteButton record={record} />,
                        ]}
                    >
                        {record.name}
                        <br />
                        {record.phoneNumber}
                    </List.Item>
                ))}
            </List>
        </section>
    );
}
