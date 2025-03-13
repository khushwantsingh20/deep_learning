import { combineReducers, applyMiddleware, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import { AUTH_LOGIN } from '../core/actionTypes';

import * as reducers from './reducers';

let unsubscribeStore;

function withDevTools(middleware) {
    if (__DEBUG__ && window.__REDUX_DEVTOOLS_EXTENSION__) {
        const devTools = window.__REDUX_DEVTOOLS_EXTENSION__();
        return compose(
            middleware,
            devTools
        );
    }
    return middleware;
}

export default function configureStore(site, { initialState = {} }) {
    const middlewares = [thunk, ...site.buildReduxMiddleware(AUTH_LOGIN)];
    let middleware = applyMiddleware(...middlewares);
    // Compose final middleware and use devtools in debug environment
    middleware = withDevTools(middleware); // eslint-disable-line no-undef

    const rootReducer = combineReducers(reducers);
    const store = createStore(rootReducer, initialState, middleware);

    // If we are hot loading this store we need this to clean up old subscriptions
    if (unsubscribeStore) unsubscribeStore();

    if (module.hot) {
        // eslint-disable-line
        // If reducers chang hotload them and replace the existing reducer
        module.hot.accept('./reducers', () => {
            // eslint-disable-line
            const nextRootReducer = require('./reducers'); // eslint-disable-line
            store.replaceReducer(combineReducers(nextRootReducer));
        });
    }

    return { store };
}
