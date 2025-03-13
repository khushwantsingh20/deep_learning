import { modelInstance } from '@alliance-software/djrad/prop-types/model';
import React, { useEffect } from 'react';
import api from '../../../common/api';
import FullPageLoading from '../../../common/misc/FullPageLoading';
import { BASE_URL } from '../../../consts';
import { StaffUser } from '../models';

export default function UserImpersonateView({ record }) {
    useEffect(() => {
        api.post(`${BASE_URL}hijack/acquire`, { userPk: record.id }).then(() => {
            if (record instanceof StaffUser) {
                window.location.href = '/admin/';
            } else {
                window.location.href = '/';
            }
        });
    });
    return <FullPageLoading />;
}

UserImpersonateView.propTypes = {
    record: modelInstance(),
};
