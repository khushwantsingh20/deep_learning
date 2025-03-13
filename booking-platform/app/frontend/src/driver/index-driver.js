import 'stop-runaway-react-effects/hijack';
import React from 'react';
import { render } from 'react-dom';

import DriverRootView from './views/DriverRootView';
import Root from '../common/containers/Root';
import { driverSite } from './djradConfig';

// Import models before importing configureStore to ensure they are configured
import './models';

import configureStore from './configureStore';

import '../styles/global.less?no-css-modules';

const appContext = window.__APP_CONTEXT__; // eslint-disable-line
const { basename, initialState } = appContext;
const { store } = configureStore(driverSite, {
    initialState,
});

render(
    <Root basename={basename} store={store} site={driverSite} rootView={DriverRootView} />,
    document.getElementById('root')
);
