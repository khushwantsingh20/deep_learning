import useRouter from '@alliance-software/djrad/hooks/useRouter';
import { useLayoutEffect, useRef } from 'react';

/**
 * When react router location changes call `onChange`
 */
export default function useOnLocationChange(onChange) {
    const { location } = useRouter();
    const previousLocation = useRef(location);

    useLayoutEffect(() => {
        if (location !== previousLocation.current) {
            onChange();
        }
    }, [location, onChange]);
}
