import { modelDetailRoute } from '@alliance-software/djrad/actions';
import useAsyncRedux from '@alliance-software/djrad/hooks/useAsyncRedux';
import { useEffect, useRef } from 'react';
import useGoogleMapsPlacesService from './useGoogleMapsPlacesService';

/**
 * Helper class that looks up address.
 *
 * This only exists as useGoogleMapsPlacesService is async in loading the
 * initial script tags. To make usage of this easier we allow calling of
 * the resolve function immediately but they are queued until the underlying
 * google maps library is available.
 */
class ServiceWrapper {
    service = false;
    error = false;
    queue = [];

    setError(error) {
        this.error = error;
        this.flush();
    }

    setService(service) {
        this.service = service;
        this.flush();
    }

    flush() {
        const copy = this.queue;
        this.queue = [];
        copy.forEach(cb => cb());
    }

    _getPlaceId(address) {
        const request = {
            query: address.formattedAddress,
            fields: ['place_id'],
        };
        return new Promise((resolve, reject) => {
            this.service.findPlaceFromQuery(request, (results, status) => {
                if (status === 'OK') {
                    resolve(results[0].place_id);
                } else {
                    reject(results);
                }
            });
        });
    }

    resolveAddress(address) {
        return new Promise((resolve, reject) => {
            this.queue.push(() => {
                if (this.error) {
                    reject(this.error);
                } else {
                    this._getPlaceId(address).then(resolve, reject);
                }
            });
            if (this.service) {
                this.flush();
            }
        });
    }
}

/**
 * Legacy data imported has no source id (google place id) on addresses. For
 * these addresses we have to resolve this ID otherwise we can't use them for
 * distance calculations.
 *
 * This hook returns a function that will resolve the source id, set it on the
 * address and return the address record with sourceId set.
 */
export default function useAddressSourceResolver() {
    const { service, isLoading, error } = useGoogleMapsPlacesService();
    const { run } = useAsyncRedux(modelDetailRoute);

    const serviceWrapper = useRef(new ServiceWrapper());

    useEffect(() => {
        if (error) {
            serviceWrapper.current.setError(error);
        } else if (service) {
            serviceWrapper.current.setService(service);
        }
    }, [error, isLoading, service]);

    return {
        async resolveAddress(address) {
            if (address.sourceId) {
                return address;
            }
            const sourceId = await serviceWrapper.current.resolveAddress(address);
            const { record } = await run('post', address, 'set-address-source-id', { sourceId });
            return record;
        },
    };
}
