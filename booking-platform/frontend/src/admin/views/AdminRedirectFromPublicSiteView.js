import ActionLink from '@alliance-software/djrad/components/model/ActionLink';
import React from 'react';
import AdminPageHeader from '../components/AdminPageHeader';
import { ClientUser } from '../user/models';

export default function AdminRedirectFromPublicSiteView() {
    return (
        <>
            <AdminPageHeader header="Logged in as staff" />
            <p>You are currently logged in as a staff member.</p>
            To access the booking app please <a href="/logout/?next=/">logout</a>,{' '}
            <ActionLink model={ClientUser} action="list">
                impersonate
            </ActionLink>{' '}
            or login as client to access client screen.
        </>
    );
}
