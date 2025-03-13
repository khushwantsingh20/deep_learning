import * as Sentry from '@sentry/browser';

if (window.__APP_CONTEXT__.sentry && window.__APP_CONTEXT__.sentry.dsn) {
    Sentry.init({
        release: __VERSION__, // eslint-disable-line
        dsn: window.__APP_CONTEXT__.sentry.dsn,
        environment: window.__APP_CONTEXT__.sentry.environment,
    });

    Sentry.configureScope(scope => {
        if (window.__APP_CONTEXT__.user.email) {
            scope.setUser({
                id: window.__APP_CONTEXT__.user.id,
                email: window.__APP_CONTEXT__.user.email,
            });
        }
    });
}
