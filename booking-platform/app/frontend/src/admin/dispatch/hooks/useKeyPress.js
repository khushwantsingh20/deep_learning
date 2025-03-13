import { useEffect } from 'react';

export default function useKeyPress(targetKey, callback, disabled) {
    useEffect(() => {
        const excludedTargets = ['INPUT', 'TEXTAREA'];
        function downHandler({ key, target }) {
            if (key === targetKey && !excludedTargets.includes(target.tagName) && !disabled) {
                callback();
            }
        }

        window.addEventListener('keydown', downHandler);
        return () => {
            window.removeEventListener('keydown', downHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disabled]);
}
