import 'stop-runaway-react-effects/hijack';
import React from 'react';
import { render } from 'react-dom';

import AdminRootView from './views/AdminRootView';
import Root from '../common/containers/Root';
import { adminSite } from './djradConfig';

// Import models before importing configureStore to ensure they are configured
import './models';

import configureStore from './configureStore';

import '../styles/global-admin.less?no-css-modules';

const appContext = window.__APP_CONTEXT__; // eslint-disable-line
const { basename, initialState } = appContext;
const { store } = configureStore(adminSite, {
    initialState,
});

render(
    <Root basename={basename} store={store} site={adminSite} rootView={AdminRootView} />,
    document.getElementById('root')
);
