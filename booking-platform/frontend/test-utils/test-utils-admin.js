import React from 'react';
import { DjradProvider } from '@alliance-software/djrad';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import configureStore from '../src/admin/configureStore';
import { adminSite } from '../src/admin/djradConfig';

const AllTheProviders = ({ children }) => {
    const { store } = configureStore(adminSite, {
        initialState: global.__APP_CONTEXT__.initialState,
    });
    return (
        <MemoryRouter>
            <DjradProvider site={adminSite} store={store}>
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
