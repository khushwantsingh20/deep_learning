import { stripLeadingSlash, stripTrailingSlash } from '@alliance-software/djrad/util/url';
import { $modelDefinition } from 'alliance-redux-api/lib/Model';

/**
 * Build a model API url manually. Useful for directly linking to it.
 * @param model The model class to link to, eg. Invoice
 * @param endpoint The endpoint on the models viewset to link to, eg, 'download'
 * @param id Optionally the id of the record if this is a detail route
 * @returns {string}
 */
export function buildModelApiUrl(model, endpoint, id = null) {
    const cleanedEndpoint = stripTrailingSlash(stripLeadingSlash(endpoint));
    const site = model._meta.permissionChecker.site;
    const baseUrl = site.getBaseApiUrl() + model[$modelDefinition].endpoint;
    if (id) {
        return `${baseUrl}/${id}/${cleanedEndpoint}/`;
    }
    return `${baseUrl}/${cleanedEndpoint}/`;
}
