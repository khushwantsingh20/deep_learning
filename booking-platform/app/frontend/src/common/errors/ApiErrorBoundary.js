import React, { Component } from 'react';
import { withRouter } from 'react-router';
import PageNotFound from '../errors/PageNotFound';
import PermissionDenied from '../errors/PermissionDenied';
import ServerError from '../errors/ServerError';

const errorCodeComponents = {
    404: PageNotFound,
    500: ServerError,
    403: PermissionDenied,
};

class ApiErrorBoundary extends Component {
    state = {};
    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
    }
    componentDidUpdate(prevProps) {
        if (this.state.error && prevProps.location !== this.props.location) {
            this.setState({ error: false, errorInfo: false });
        }
    }
    render() {
        if (this.state.error) {
            if (
                this.state.error &&
                typeof this.state.error == 'object' &&
                this.state.error.status
            ) {
                const { status } = this.state.error;
                const ErrorComponent = errorCodeComponents[status];
                if (ErrorComponent) {
                    return <ErrorComponent error={this.state.error} />;
                }
            }
            throw this.state.error;
        }

        return this.props.children;
    }
}

export default withRouter(ApiErrorBoundary);
