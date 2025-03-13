import { useEffect, useRef, useState } from 'react';

const injectedScripts = {};

function injectScript(id, url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');

        script.type = 'text/javascript';
        script.src = url;
        script.id = id;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = reject;

        document.head.appendChild(script);
    });
}

export default function useInjectScript(id, url) {
    const isMounted = useRef(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);
    useEffect(function trackMountedState() {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);
    useEffect(() => {
        let isCurrent = true;
        let valid = true;
        if (!injectedScripts[id]) {
            injectedScripts[id] = {
                url,
                promise: injectScript(id, url),
            };
        } else if (injectedScripts[id].url !== url) {
            valid = false;
            // eslint-disable-next-line no-console
            console.warn(
                `URL for injected script ${id} changed. This has no effect - URL for id should not changed. Original URL: ${injectedScripts[id].url} New URL: ${url}`
            );
        }
        if (valid) {
            injectedScripts[id].promise.then(
                () => {
                    if (isCurrent) {
                        setIsLoaded(true);
                    }
                },
                () => {
                    if (isCurrent) {
                        setError(true);
                    }
                }
            );
        }
        return () => {
            isCurrent = false;
        };
    }, [id, url]);
    return { error, isLoaded };
}
