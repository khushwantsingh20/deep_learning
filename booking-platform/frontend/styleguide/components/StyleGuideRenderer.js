import React from 'react';
import PropTypes from 'prop-types';
import DefaultStyleGuideRenderer from 'react-styleguidist/lib/client/rsg-components/StyleGuide/StyleGuideRenderer';
import { configureApi } from 'alliance-redux-api/lib/api';

import { BASE_API_URL } from '../../src/consts';
import '../../src/app/models';
import configureStore from '../../src/app/configureStore';
import { appSite } from '../../src/app/djradConfig';

import '../../src/styles/global.less?no-css-modules';

// Copied from index.js
const appContext = window.__APP_CONTEXT__; // eslint-disable-line
const { initialState } = appContext;
const { store } = configureStore(appSite, {
    initialState,
});

configureApi(BASE_API_URL, {
    isDefault: false,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
    },
});

export default class StyleGuideRenderer extends React.Component {
    static childContextTypes = {
        getStyleGuideConfig: PropTypes.func,
    };

    getStyleGuideConfig = () => ({
        djradSite: appSite,
        store,
    });

    getChildContext() {
        return {
            getStyleGuideConfig: this.getStyleGuideConfig,
        };
    }

    render() {
        return <DefaultStyleGuideRenderer {...this.props} title="Style guide" />;
    }
}
