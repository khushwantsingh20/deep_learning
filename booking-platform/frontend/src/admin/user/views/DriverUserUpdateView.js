import React from 'react';
import { Button, notification } from 'antd';
import { DriverUser } from '../../../common/user/models';
import { defaultOnSuccess } from '../../crud/handlers';
import UpdateView from '../../crud/UpdateView';
import DriverUserForm from '../components/DriverUserForm';

function onSuccess(response, extra) {
    defaultOnSuccess(response, extra);
    if (response.otherDrivers) {
        notification.open({
            title: 'Vehicle assigned to more than one driver',
            message: (
                <div>
                    <p>The assigned vehicle is being driven by one or more other drivers:</p>
                    <ul>
                        {response.otherDrivers.map(driver => (
                            <li key={driver.id}>
                                <Button
                                    type="link"
                                    onClick={() =>
                                        extra.history.push(
                                            extra.getActionUrl(DriverUser, 'update', {
                                                id: driver.id,
                                            })
                                        )
                                    }
                                >
                                    {driver.name}
                                </Button>
                            </li>
                        ))}
                    </ul>
                    <p>
                        This vehicle is assigned to any bookings completed by these drivers so
                        please ensure that this list is accurate.
                    </p>
                </div>
            ),
        });
    }
}

export default function DriverUserUpdateView(props) {
    return (
        <UpdateView
            renderForm={formProps => <DriverUserForm {...formProps} />}
            {...props}
            onSuccess={onSuccess}
        />
    );
}
