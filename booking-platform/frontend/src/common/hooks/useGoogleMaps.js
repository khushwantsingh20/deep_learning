import useSettings from '@alliance-software/djrad/hooks/useSettings';
import useInjectScript from './useInjectScript';

export default function useGoogleMaps() {
    const { googleApiKey } = useSettings();
    const url = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=geocoder,places`;
    return useInjectScript('google-maps', url);
}
