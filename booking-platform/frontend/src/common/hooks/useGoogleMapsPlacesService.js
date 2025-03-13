import { useRef } from 'react';
import useGoogleMaps from './useGoogleMaps';

const DUMMY_CONTAINER_ID = '__maps-dummy-container';
function getMapsContainer() {
    let el = document.getElementById(DUMMY_CONTAINER_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = DUMMY_CONTAINER_ID;
        document.body.appendChild(el);
    }
    return el;
}

/**
 * Get access to the PlacesService for Google maps.
 *
 * Unfortunately this requires DOM element even if not using anything that
 * renders (eg. looking up a place id). This handles creating this for you.
 */
export default function useGoogleMapsPlacesService() {
    const { isLoaded, error } = useGoogleMaps();
    const service = useRef();
    if (!isLoaded) {
        return { isLoading: true };
    }
    if (error) {
        return { error };
    }
    if (!service.current) {
        service.current = new window.google.maps.places.PlacesService(getMapsContainer());
    }
    return { service: service.current };
}
