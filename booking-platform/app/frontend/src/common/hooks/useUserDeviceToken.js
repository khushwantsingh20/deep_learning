import { useState, useEffect } from 'react';
import { webkitBridge } from '../webkitBridge';

export default function useUserDeviceToken() {
    const [token, setToken] = useState();

    useEffect(() => {
        const unsub = webkitBridge.onValueUpdated('deviceToken', setToken);

        if (!webkitBridge.values.deviceToken) {
            webkitBridge.requestValue('requestDeviceToken');
        }

        return unsub;
    }, []);

    return { token };
}
