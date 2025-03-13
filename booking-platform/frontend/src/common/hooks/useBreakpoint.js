import useMedia from './useMedia';

/**
 * Get which of the common breakpoints for this app currently match
 * @returns {{isDesktop: boolean, isMobile: boolean}}
 */
export default function useBreakpoint() {
    const isMobile = useMedia('(max-width: 767px)');
    const isTablet = useMedia('(min-width: 768px) and (max-width: 990px)');
    const isDesktop = useMedia('(min-width: 991px)');

    return {
        isMobile,
        isTablet,
        isDesktop,
    };
}
