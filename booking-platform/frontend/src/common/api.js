import { $modelDefinition } from 'alliance-redux-api/lib/Model';
import trim from 'lodash/trim';
import { ApiError } from '@alliance-software/djrad/api';
import { buildHeaders, getApiConfigFor } from 'alliance-redux-api/lib/api';
import { buildModelApiUrl } from './url';

function decodeBody(response) {
    const contentType = response.headers.get('Content-Type');
    const emptyCodes = [204, 205];

    if (emptyCodes.includes(response.status)) {
        return null;
    }

    if (contentType && contentType.includes('json')) {
        return response.json();
    }

    // TODO: Current don't care about any other types
    // arrayBuffer()?
    // blob()?
    // formData()?

    return response.text();
}

/**
 * Django rest framework filters in query parameters require booleans be
 * either True or False
 */
function convertDjangoQueryParam(key, value) {
    if (value === true) return [key, 'True'];
    if (value === false) return [key, 'False'];
    return [key, value];
}

export const identity = (...args) => args;

const parseRecordLike = recordLike => {
    if (Array.isArray(recordLike)) {
        return recordLike;
    }
    return [recordLike, recordLike.getId()];
};

export function toQueryString(params, convertQueryParam = identity) {
    return Object.entries(params)
        .map(pair => {
            const [key, value] = convertQueryParam(pair[0], pair[1]);
            if (Array.isArray(value)) {
                const values = value.map(encodeURIComponent).join(`&${encodeURIComponent(key)}=`);
                return `${encodeURIComponent(key)}=${values}`;
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join('&');
}

function buildEndpointWithQueryParams(endpoint, params, apiConfig) {
    if (endpoint.indexOf('?') !== -1) {
        throw new Error(
            `Call to API method provided endpoint of ${endpoint} which contains a '?'. Pass ` +
                'any query parameters through as an object to the second parameter'
        );
    }
    endpoint = trim(endpoint, '/');
    if (apiConfig.appendSlash) {
        endpoint += '/';
    }
    return [
        endpoint,
        // Convert query params into form expected by django-rest-framework
        toQueryString(params, convertDjangoQueryParam),
    ]
        .filter(Boolean)
        .join('?');
}

async function callEndpoint(endpoint, method, { queryParams = {}, body, headers = {} } = {}) {
    const config = getApiConfigFor(endpoint);
    const defaultHeaders = buildHeaders(config);
    const url = buildEndpointWithQueryParams(endpoint, queryParams, config);

    const response = await fetch(url, {
        method,
        body,
        headers: {
            ...defaultHeaders,
            ...headers,
        },
        credentials: config.credentials,
    });

    const decodedBody = await decodeBody(response);
    if (response.ok) {
        return decodedBody;
    }

    throw new ApiError(response.status, response.statusText, decodedBody);
}

/**
 * Creates a record instance for use with modelDetailRoute etc when you only
 * have an ID. It fakes it by using the partial record class so that all fields
 * are optional. modelDetailRoute only needs the ID and the meta data about the
 * model so this works fine
 * @param modelClass The model class to create a record from
 * @param id The primary key value for the record
 */
export function createRecordFromId(modelClass, id) {
    const { pkFieldName } = modelClass._meta;
    return new modelClass[$modelDefinition].partialRecordClass({ [pkFieldName]: id });
}

/**
 * Helper methods to interact with API when you are not dealing with model data. Works the same
 * as calling the alliance-redux-api get/post/patch or modelDetailRoute with hasCustomResponse
 * but without the tedium of needing to use redux to dispatch it.
 *
 * Returns a promise that resolves to the response data or rejects with an ApiError if not.
 */
const api = {
    get(endpoint, queryParams = {}, options) {
        return callEndpoint(endpoint, 'GET', { queryParams, ...options });
    },
    post(endpoint, data = {}, options) {
        return callEndpoint(endpoint, 'POST', { body: JSON.stringify(data), ...options });
    },
    patch(endpoint, data = {}, options) {
        return callEndpoint(endpoint, 'PATCH', { body: JSON.stringify(data), ...options });
    },
    /**
     * Call a list route on a model where the response doesn't need to go into redux
     *
     * Use this instead of `modelListRoute` with `{ hasCustomResponse: true }`.
     * @param modelClass The model class the endpoint is against.
     * @param endpoint The url of the endpoint on the viewset
     * @param data The data to submit (if any)
     * @param options extra options to pass through to `post`
     * @returns {Promise}
     */
    listRoutePost(modelClass, endpoint, data = {}, options) {
        return api.post(buildModelApiUrl(modelClass, endpoint), data, options);
    },
    listRoutePatch(modelClass, endpoint, data = {}, options) {
        return api.patch(buildModelApiUrl(modelClass, endpoint), data, options);
    },
    listRouteGet(modelClass, endpoint, queryParams = {}, options) {
        return api.get(buildModelApiUrl(modelClass, endpoint), queryParams, options);
    },
    /**
     * Call a detail route on a model where the response doesn't need to go into redux
     *
     * Use this instead of `modelDetailRoute` with `{ hasCustomResponse: true }`.
     * @param recordLike The record the endpoint is against. Can either be a record instance or
     * an array of two elements - the model class and the id.
     * @param endpoint The url of the endpoint on the viewset
     * @param data The data to submit (if any)
     * @param options extra options to pass through to `post`
     * @returns {Promise}
     */
    detailRoutePost(recordLike, endpoint, data = {}, options) {
        const [modelClass, id] = parseRecordLike(recordLike);
        return api.post(buildModelApiUrl(modelClass, endpoint, id), data, options);
    },
    detailRoutePatch(recordLike, endpoint, data = {}, options) {
        const [modelClass, id] = parseRecordLike(recordLike);
        return api.patch(buildModelApiUrl(modelClass, endpoint, id), data, options);
    },
    detailRouteGet(recordLike, endpoint, queryParams = {}, options) {
        const [modelClass, id] = parseRecordLike(recordLike);
        return api.get(buildModelApiUrl(modelClass, endpoint, id), queryParams, options);
    },
};

export default api;
