import DeferredInitModel from '@alliance-software/djrad/model/DeferredInitModel';

export default class ScbpModel extends DeferredInitModel {
    /**
     * Return string to use in the HTML head title for pages relating to this model
     * @returns {string}
     */
    static getHtmlTitle() {
        return this._meta.labelPlural;
    }

    /**
     * Return string to use in the HTML head title for pages relating to a specific instance of this model
     * @returns {string}
     */
    getHtmlTitle() {
        return `${this._meta.label} - ${this.__str__}`;
    }

    /**
     * Return something to render as the heading for a CRUD pages for this model
     *
     * Should not include any wrapping heading tags - just the content to be shown.
     *
     * See PageHeader header prop for example of where it will be passed to
     *
     * @returns {string}
     */
    static getPageHeader() {
        return this._meta.labelPlural;
    }
    /**
     * Return something to render as the heading for a CRUD pages for a specific instance of this model
     *
     * Should not include any wrapping heading tags - just the content to be shown.
     *
     * See PageHeader header prop for example of where it will be passed to
     *
     * @returns {string}
     */
    getPageHeader() {
        return this.__str__;
    }
}
