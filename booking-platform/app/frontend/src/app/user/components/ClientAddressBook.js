import { Button, Icon, List, Modal } from 'antd';
import React from 'react';
import { PropTypes } from 'prop-types';
import { ClientAddressType } from '../../../choiceConstants';
import { ReactComponent as IconOffice } from '../../../images/icon-building.svg';
import { ReactComponent as IconHome } from '../../../images/icon-home.svg';
import { ReactComponent as IconOther } from '../../../images/icon-pin.svg';
import ClientAddressCreateEdit from '../../components/ClientAddressCreateEdit';
import styles from '../views/UserProfileView.less';
import ClientAddressDelete from './ClientAddressDelete';
import ClientAddressDisplay from './ClientAddressDisplay';

function ClientAddressBook({
    addresses,
    isLoading,
    clientUserId,
    modalProps,
    setModalProps,
    deleteModalProps,
    setDeleteModalProps,
    closeModal,
}) {
    let { homeAddress, officeAddress, otherAddresses } = [];

    if (!isLoading) {
        addresses = addresses.map(adr => {
            return {
                title: adr.addressLabel,
                description: adr.formattedAddress,
                instructions: adr.addressInstructions,
                type: adr.addressType,
                address: adr,
            };
        });

        homeAddress = addresses.filter(a => a.type === ClientAddressType.HOME.value);
        officeAddress = addresses.filter(a => a.type === ClientAddressType.OFFICE.value);
        otherAddresses = addresses.filter(a => a.type === ClientAddressType.OTHER.value);
    }

    return (
        <div className={styles.addressBook}>
            <section className={styles.sectionHome}>
                <h3>
                    <span className={styles.icon}>
                        <IconHome aria-hidden="true" />
                    </span>
                    Home
                    {homeAddress <= 0 && (
                        <Button
                            htmlType="button"
                            type="primary"
                            onClick={() =>
                                setModalProps({
                                    client: clientUserId,
                                    addressType: ClientAddressType.HOME,
                                })
                            }
                        >
                            Add Home
                        </Button>
                    )}
                </h3>
                <List
                    dataSource={homeAddress}
                    itemLayout="horizontal"
                    loading={isLoading}
                    locale={{
                        emptyText: <p>You haven&apos;t set a home address.</p>,
                    }}
                    renderItem={item => (
                        <List.Item
                            actions={[
                                <Button
                                    type="link"
                                    onClick={() =>
                                        setModalProps({
                                            client: clientUserId,
                                            address: item.address,
                                        })
                                    }
                                >
                                    Edit
                                </Button>,
                                <Button
                                    type="danger"
                                    className="btn-link"
                                    onClick={() => setDeleteModalProps({ address: item.address })}
                                >
                                    <Icon type="close" />
                                    <span className="sr-only">Delete</span>
                                </Button>,
                            ]}
                        >
                            <ClientAddressDisplay item={item} />
                        </List.Item>
                    )}
                />
            </section>

            <section className={styles.sectionOffice}>
                <h3>
                    <span className={styles.icon}>
                        <IconOffice />
                    </span>
                    Office
                    {officeAddress <= 0 && (
                        <Button
                            htmlType="button"
                            type="primary"
                            onClick={() =>
                                setModalProps({
                                    client: clientUserId,
                                    addressType: ClientAddressType.OFFICE,
                                })
                            }
                        >
                            Add Office
                        </Button>
                    )}
                </h3>
                <List
                    dataSource={officeAddress}
                    itemLayout="horizontal"
                    loading={isLoading}
                    locale={{
                        emptyText: <p>You haven&apos;t set an office address.</p>,
                    }}
                    renderItem={item => (
                        <List.Item
                            actions={[
                                <Button
                                    type="link"
                                    onClick={() =>
                                        setModalProps({
                                            client: clientUserId,
                                            address: item.address,
                                        })
                                    }
                                >
                                    Edit
                                </Button>,
                                <Button
                                    type="danger"
                                    className="btn-link"
                                    onClick={() => setDeleteModalProps({ address: item.address })}
                                >
                                    <Icon type="close" />
                                    <span className="sr-only">Delete</span>
                                </Button>,
                            ]}
                        >
                            <ClientAddressDisplay item={item} />
                        </List.Item>
                    )}
                />
            </section>

            <section className={styles.sectionOther}>
                <h3>
                    <span className={styles.icon}>
                        <IconOther />
                    </span>
                    Other
                    <Button
                        htmlType="button"
                        type="primary"
                        ghost
                        onClick={() =>
                            setModalProps({
                                client: clientUserId,
                                addressType: ClientAddressType.OTHER,
                            })
                        }
                    >
                        Add Address
                    </Button>
                </h3>
                <List
                    dataSource={otherAddresses}
                    itemLayout="horizontal"
                    loading={isLoading}
                    locale={{
                        emptyText: (
                            <p>
                                You currently don&apos;t have any addresses. Why not{' '}
                                <Button
                                    htmlType="button"
                                    type="link"
                                    onClick={() =>
                                        setModalProps({
                                            client: clientUserId,
                                            addressType: ClientAddressType.OTHER,
                                        })
                                    }
                                >
                                    add one
                                </Button>
                            </p>
                        ),
                    }}
                    renderItem={item => (
                        <List.Item
                            actions={[
                                <Button
                                    type="link"
                                    onClick={() =>
                                        setModalProps({
                                            client: clientUserId,
                                            address: item.address,
                                        })
                                    }
                                >
                                    Edit
                                </Button>,
                                <Button
                                    className={styles.deleteLinkButton}
                                    onClick={() => setDeleteModalProps({ address: item.address })}
                                >
                                    Delete
                                </Button>,
                            ]}
                        >
                            <ClientAddressDisplay item={item} />
                        </List.Item>
                    )}
                />
            </section>
            {modalProps && (
                <Modal
                    onCancel={() => closeModal()}
                    title={
                        modalProps.addressType
                            ? `Add ${modalProps.addressType.label} Address`
                            : `Edit ${modalProps.address.addressLabel} Address`
                    }
                    footer={null}
                    visible
                    className="modal-md"
                >
                    <ClientAddressCreateEdit
                        {...modalProps}
                        clientUserId={clientUserId}
                        onSuccess={() => closeModal()}
                        onDelete={address => {
                            closeModal();
                            return setDeleteModalProps({ address });
                        }}
                    />
                </Modal>
            )}

            {deleteModalProps && (
                <Modal
                    onCancel={() => setDeleteModalProps(false)}
                    title="Delete Address"
                    footer={null}
                    visible
                    className="modal-md"
                >
                    <ClientAddressDelete
                        {...deleteModalProps}
                        onSuccess={() => setDeleteModalProps(false)}
                    />
                </Modal>
            )}
        </div>
    );
}

export default ClientAddressBook;

ClientAddressBook.propTypes = {
    addresses: PropTypes.array.isRequired,
    isLoading: PropTypes.bool,
    clientUserId: PropTypes.number,
    modalProps: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
    setModalProps: PropTypes.func,
    deleteModalProps: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
    setDeleteModalProps: PropTypes.func,
    closeModal: PropTypes.func,
};
