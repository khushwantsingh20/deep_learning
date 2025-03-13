import { useState, useEffect } from 'react';

/**
 * Run & listen to a media query - returns true when media query matches
 *
 * @param query The query to run eg (max-width: 599px)
 * @returns {boolean} Whether the query matches
 */
export default function useMedia(query) {
    const [match, setMatch] = useState(window.matchMedia(query).matches);

    useEffect(() => {
        const mql = window.matchMedia(query);
        // Set a listener for each media query with above handler as callback.
        const onChange = e => {
            setMatch(e.matches);
        };
        // Use addListener instead of addEventListener to support "old" browsers
        // (but this includes latest Safari...)
        // https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList/addListener
        mql.addListener(onChange);
        // Remove listeners on cleanup
        return () => mql.removeListener(onChange);
    }, [query]);

    return match;
}
