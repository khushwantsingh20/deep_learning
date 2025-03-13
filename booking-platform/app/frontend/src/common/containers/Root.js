import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter } from 'react-router-dom';
import { DjradProvider } from '@alliance-software/djrad';
import { Route } from 'react-router';
import { hot } from 'react-hot-loader/root';
import { ErrorBoundary } from './ErrorBoundary';

function Root(props) {
    const { basename, rootView: RootView } = props;
    return (
        <ErrorBoundary resetOnLocationChange={false}>
            <BrowserRouter basename={basename}>
                <DjradProvider
                    site={props.site}
                    store={props.store}
                    settings={window.__APP_CONTEXT__.settings}
                >
                    <Route component={RootView} />
                </DjradProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

Root.propTypes = {
    basename: PropTypes.string.isRequired,
    rootView: PropTypes.func.isRequired,
};

export default hot(Root); // eslint-disable-line
