import { useState, useEffect } from 'react';
import moment from 'moment';

export default function useNow() {
    const [now, setNow] = useState(new moment());

    useEffect(() => {
        const timer = setInterval(() => setNow(new moment()), 1000);
        return () => clearInterval(timer);
    }, []);

    return { now };
}
