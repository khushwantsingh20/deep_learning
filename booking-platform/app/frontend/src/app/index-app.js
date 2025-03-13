import 'stop-runaway-react-effects/hijack';
import React from 'react';
import { render } from 'react-dom';

import AppView from './views/AppView';
import Root from '../common/containers/Root';
import { appSite } from './djradConfig';

// Import models before importing configureStore to ensure they are configured
import './models';

import configureStore from './configureStore';

import '../styles/global.less?no-css-modules';

// Required because app references it... doesn't need to do anything. Will be removed in future.
window.iosInject = () => {};

const appContext = window.__APP_CONTEXT__; // eslint-disable-line
const { basename, initialState } = appContext;
const { store } = configureStore(appSite, {
    initialState,
});

render(
    <Root basename={basename} store={store} site={appSite} rootView={AppView} />,
    document.getElementById('root')
);
