import { useState, useEffect } from 'react';
import { webkitBridge } from '../webkitBridge';
import useGoogleMaps from './useGoogleMaps';

export default function useUserLocation() {
    const [location, setLocation] = useState();
    const { isLoaded, error } = useGoogleMaps();

    useEffect(() => {
        if (isLoaded) {
            const unsub = webkitBridge.onValueUpdated('location', loc => {
                const geocoder = new google.maps.Geocoder(); // eslint-disable-line
                const latlng = { lat: parseFloat(loc[0]), lng: parseFloat(loc[1]) };
                geocoder.geocode({ location: latlng }, (results, status) => {
                    if (status !== 'OK') {
                        console.log('Geocoder failed', results, status); // eslint-disable-line
                        return;
                    }
                    setLocation(results[0]);
                });
            });

            if (!webkitBridge.values.location) {
                webkitBridge.requestValue('requestLocation');
            }

            return unsub;
        }
        return undefined;
    }, [isLoaded]);

    return { isLoaded, error, location };
}
