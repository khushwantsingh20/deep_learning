import React from 'react';
import { DjradProvider } from '@alliance-software/djrad';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import configureStore from '../src/app/configureStore';
import { appSite } from '../src/app/djradConfig';

const AllTheProviders = ({ children }) => {
    const { store } = configureStore(appSite, {
        initialState: global.__APP_CONTEXT__.initialState,
    });
    return (
        <MemoryRouter>
            <DjradProvider site={appSite} store={store}>
                {children}
            </DjradProvider>
        </MemoryRouter>
    );
};

const customRender = (ui, options) => render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
