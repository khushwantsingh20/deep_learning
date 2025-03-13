import Site from '@alliance-software/djrad/site/Site';
import ScbpModel from '../core/model';
import ScbpFieldFactory from '../core/fieldFactory';

const { baseUrl, djradContext } = window.__APP_CONTEXT__;

const apiConfig = {
    headers: {
        // This is used by djrad_rest.authentication.BasicAuthentication so we can detect session expiry
        'X-Requested-With': 'XMLHttpRequest',
    },
};

export const driverSite = new Site(baseUrl, 'driver', apiConfig, djradContext);

driverSite.setBaseModelClass(ScbpModel);
driverSite.setFieldFactoryClass(ScbpFieldFactory);

if (module.hot) {
    // eslint-disable-line
    module.hot.accept('@alliance-software/djrad', () => {
        // eslint-disable-line
        // Don't need to do anything; this is sufficient to get hot loading of djrad related components
        // working
    });
}
