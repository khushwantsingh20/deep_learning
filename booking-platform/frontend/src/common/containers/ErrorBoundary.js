import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import * as Sentry from '@sentry/browser';
import { SENTRY_ENABLED } from '../../consts';

import ErrorFallback from './ErrorFallback';

export class ErrorBoundary extends React.Component {
    static propTypes = {
        /** If true once an error has occurred changing route will re-render children */
        resetOnLocationChange: PropTypes.bool,
    };

    static defaultProps = {
        resetOnLocationChange: true,
    };
    state = {};
    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        if (SENTRY_ENABLED) {
            Sentry.withScope(scope => {
                Object.keys(errorInfo).forEach(key => {
                    scope.setExtra(key, errorInfo[key]);
                });
                Sentry.captureException(error);
            });
        }
    }
    componentDidUpdate(prevProps) {
        if (
            this.props.resetOnLocationChange &&
            this.state.error &&
            prevProps.location !== this.props.location
        ) {
            this.setState({ error: false, errorInfo: false }); // eslint-disable-line
        }
    }
    render() {
        if (this.state.error) {
            return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} />;
        }

        return this.props.children;
    }
}

export default withRouter(ErrorBoundary);
