import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { MemoryRouter } from 'react-router-dom';
import DefaultPreview from 'react-styleguidist/lib/client/rsg-components/Preview/Preview';
import ReactExample from 'react-styleguidist/lib/client/rsg-components/ReactExample/ReactExample';
import DjradProvider from '@alliance-software/djrad/site/components/DjradProvider';

import FakeBrowser from './FakeBrowser';

// This is a huge hack so can pass props through to our wrapper component from examples.
// Copied from https://github.com/styleguidist/react-styleguidist/blob/master/src/rsg-components/Preview/Preview.js
export default class Preview extends DefaultPreview {
    static contextTypes = {
        djradSite: PropTypes.object,
        config: PropTypes.object.isRequired,
        codeRevision: PropTypes.number.isRequired,
        getStyleGuideConfig: PropTypes.func.isRequired,
    };

    executeCode() {
        this.setState({
            error: null,
        });

        const { code } = this.props;
        if (!code) {
            return;
        }

        let lines = code.split('\n');
        const useFakeBrowser = lines.length > 0 && lines[0].match(/fakeBrowser/);
        let wrappedComponent = (
            <ReactExample
                code={useFakeBrowser ? lines.slice(1).join('\n') : code}
                evalInContext={this.props.evalInContext}
                onError={this.handleError}
                compilerConfig={this.context.config.compilerConfig}
            />
        );

        if (useFakeBrowser) {
            wrappedComponent = <FakeBrowser>{wrappedComponent}</FakeBrowser>;
        }

        if (!this.context.djradSite) {
            const config = this.context.getStyleGuideConfig();
            const { store, djradSite } = config;
            wrappedComponent = (
                <MemoryRouter>
                    <DjradProvider
                        store={store}
                        site={djradSite}
                        settings={window.__APP_CONTEXT__.settings}
                    >
                        {wrappedComponent}
                    </DjradProvider>
                </MemoryRouter>
            );
        }

        window.requestAnimationFrame(() => {
            this.unmountPreview();
            try {
                ReactDOM.render(wrappedComponent, this.mountNode);
            } catch (err) {
                this.handleError(err);
            }
        });
    }
}
