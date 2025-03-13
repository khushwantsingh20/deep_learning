import { useCallback, useEffect, useState } from 'react';
import moment from 'moment';

export default function useRefreshTimer(onRefresh) {
    const [forced, setForce] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(moment().toISOString());
    const handleRefresh = useCallback(() => {
        onRefresh();
        setLastRefresh(moment().toISOString());
    }, [onRefresh]);
    useEffect(() => {
        const intervalId = setInterval(handleRefresh, 120 * 1000);
        return () => clearInterval(intervalId);
    }, [handleRefresh, forced]);
    return {
        forceRefresh: () => {
            handleRefresh();
            setForce(isForced => !isForced);
        },
        lastRefresh,
    };
}
