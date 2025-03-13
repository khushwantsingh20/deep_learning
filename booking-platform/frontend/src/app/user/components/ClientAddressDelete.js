import { deleteModel } from '@alliance-software/djrad/actions';
import ButtonBar from '@alliance-software/djrad/components/form/ButtonBar';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import { Button, List } from 'antd/lib/index';
import PropTypes from 'prop-types';
import React from 'react';
import styles from '../views/UserProfileView.less';

function ClientAddressDelete({ address, onSuccess }) {
    const { error, isLoading: isDeleting, run } = useAsyncRedux(deleteModel, {
        args: [address, address.getId()],
    });
    const handleDelete = () => run().then(onSuccess);

    if (error) {
        return <div>Something went wrong, please try again</div>;
    }

    return (
        <div className={styles.deleteModalContent}>
            <p>Are you sure you want to delete the following address?</p>

            <List
                dataSource={[address.toJS()]}
                renderItem={item => (
                    <List.Item>
                        <List.Item.Meta
                            title={item.addressLabel}
                            description={item.formattedAddress}
                        />
                    </List.Item>
                )}
            />
            <ButtonBar
                rightButtons={
                    <Button
                        htmlType="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete()}
                        type="danger"
                    >
                        Yes, delete this address
                    </Button>
                }
            />
        </div>
    );
}

export default ClientAddressDelete;

ClientAddressDelete.propTypes = {
    address: PropTypes.object,
    onSuccess: PropTypes.func,
};
