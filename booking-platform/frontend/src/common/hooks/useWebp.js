import { useState, useEffect } from 'react';
import { checkWebpSupport } from '../data/util';

export const useWebp = () => {
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        checkWebpSupport(result => {
            setSupported(result);
        });
    }, []);

    return supported;
};
