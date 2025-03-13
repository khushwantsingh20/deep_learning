import { Alert, Button } from 'antd';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { persistBookingState } from '../../../app/booking/hooks/useCreateBookingState';
import { authSelectors } from '../reducer';
import { User } from '../../user/models';
import api from '../../../common/api';
import { BASE_URL } from '../../../consts';

export default function HijackedUserBanner() {
    const isHijacked = useSelector(authSelectors.isHijackedUser);
    const currentUser = useSelector(User.selectors.currentUser);
    const onClick = useCallback(() => {
        api.post(`${BASE_URL}hijack/release-hijack/`).then(() => {
            persistBookingState({});
            window.location.href = '/admin/';
        });
    }, []);
    if (!isHijacked) {
        return null;
    }
    return (
        <Alert
            message={
                <div>
                    You are currently working on behalf of {currentUser.__str__}.{' '}
                    <Button onClick={onClick} type="link">
                        Release
                    </Button>
                </div>
            }
            type="info"
            banner
        />
    );
}
