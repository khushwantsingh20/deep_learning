import React from 'react';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/browser';
import { Button } from 'antd';

import styles from './ErrorFallback.less';

function DevDetails({ error, errorInfo }) {
    if (__DEBUG__) {
        return (
            <div className={styles.debugTrace}>
                <h4>Trace (this section is shown only during development)</h4>
                <details style={{ whiteSpace: 'pre-wrap' }}>
                    {error && error.toString()}
                    <br />
                    {errorInfo.componentStack}
                </details>
                <p>See console for more information</p>
            </div>
        );
    }
    return null;
}

DevDetails.propTypes = {
    error: PropTypes.object,
    errorInfo: PropTypes.object,
};

export default function ErrorFallback({ error, errorInfo }) {
    return (
        <div className={styles.fallback}>
            <h1>Sorry, we encountered a problem...</h1>
            <p>
                Please take a moment to{' '}
                <Button
                    type="link"
                    onClick={() => Sentry.showReportDialog()}
                    style={{ padding: 0 }}
                >
                    report feedback
                </Button>{' '}
                and we will look into it as soon as possible.
            </p>
            {__DEBUG__ && <DevDetails error={error} errorInfo={errorInfo} />}
        </div>
    );
}

ErrorFallback.propTypes = {
    error: PropTypes.object,
    errorInfo: PropTypes.object,
};
