describe('bookings step 1::scbp_core.tests.cypress.app.accounts.AccountSwitchingTestCase', () => {
    beforeEach(() => {
        cy.server();
        cy.route('POST', '/rad-api/scbp_core.account/*/set-active-for-session/').as(
            'switchAccount'
        );
    });
    it('client user should get default account when logging in', () => {
        cy.visitApp('login');
        cy.getByPlaceholderText('Email address').type('client@localhost.dev');
        cy.getByPlaceholderText('Password').type('password{enter}');
        cy.url().should('eq', Cypress.config().baseUrl + Cypress.config().appUrlPart);
        cy.getByTestId('account-dropdown').click();
        cy.getByTestId('logged-in-user').should('contain', 'Bob Marley');
        cy.getByTestId('active-account-nickname').should('contain', 'Account 1');
        cy.getAllByTestId('account-switch-button').should($buttons => {
            expect($buttons, '2 items').to.have.length(2);
            expect($buttons.eq(0), 'first item').to.contain('Account 2');
            expect($buttons.eq(1), 'second item').to.contain('Account 3');
        });
        // If we refresh should get default account
        cy.reload();
        cy.getByTestId('account-dropdown').click();
        cy.getByTestId('active-account-nickname').should('contain', 'Account 1');
    });
    it('client user should be able to switch accounts', () => {
        cy.visitApp('login');
        cy.getByPlaceholderText('Email address').type('client@localhost.dev');
        cy.getByPlaceholderText('Password').type('password{enter}');
        cy.url().should('eq', Cypress.config().baseUrl + Cypress.config().appUrlPart);
        cy.getByTestId('account-dropdown').click();
        cy.getByTestId('logged-in-user').should('contain', 'Bob Marley');
        cy.getByTestId('active-account-nickname').should('contain', 'Account 1');
        cy.getByText('Account 2').click({ force: true });
        cy.wait('@switchAccount');
        // After the switchAccount finishes the re-render doesn't appear to happen in time to "just work" here...
        // A cy.wait(1) works but so does using cy.get() - it waits for the condition to be true
        cy.get('[data-testid="active-account-nickname"]').should('contain', 'Account 2');
        cy.getAllByTestId('account-switch-button').should($buttons => {
            expect($buttons, '2 items').to.have.length(2);
            expect($buttons.eq(0), 'first item').to.contain('Account 1');
            expect($buttons.eq(1), 'second item').to.contain('Account 3');
        });
        // If we refresh should get account we switched to
        cy.reload();
        cy.getByTestId('account-dropdown').click();
        cy.getByTestId('active-account-nickname').should('contain', 'Account 2');
    });

    it('client user should not be able to use account after unlinked', () => {
        cy.visitApp('login');
        cy.getByPlaceholderText('Email address').type('client@localhost.dev');
        cy.getByPlaceholderText('Password').type('password{enter}');
        cy.url().should('eq', Cypress.config().baseUrl + Cypress.config().appUrlPart);
        cy.getByTestId('account-dropdown').click();
        cy.getByTestId('logged-in-user').should('contain', 'Bob Marley');
        cy.getByTestId('active-account-nickname').should('contain', 'Account 1');
        cy.request(
            '/cypress/call/scbp_core.tests.cypress.app.accounts.AccountSwitchingTestCase.removeAccountLink/'
        );
        cy.reload();
        cy.getByTestId('account-dropdown').click();
        cy.getByTestId('active-account-nickname').should('contain', 'Account 2');
    });

    it('creating initial account should be set as active', () => {
        cy.visitApp('login');
        cy.getByPlaceholderText('Email address').type('client2@localhost.dev');
        cy.getByPlaceholderText('Password').type('password{enter}');
        cy.url().should('eq', Cypress.config().baseUrl + Cypress.config().appUrlPart);
        cy.getByTestId('account-dropdown').click();
        cy.getByTestId('logged-in-user').should('contain', 'Salty Sand');
        cy.getByTestId('new-billing-account').click();
        cy.getByLabelText('Personal').click();
        const accountName = 'Account the first';
        cy.getByLabelText('Account Nickname').type(accountName);
        cy.getByText('Add Credit Card').click({ force: true });
        cy.fillCreditCard();
        cy.getByText('Assign Card').click({ force: true });
        cy.getByText('Last four digits:').should('exist');
        cy.getByText('Create account').click({ force: true });
        cy.url().should('eq', Cypress.config().baseUrl + Cypress.config().appUrlPart);
        cy.getByTestId('account-dropdown').click();
        cy.get('[data-testid="active-account-nickname"]').should('contain', accountName);
        cy.reload();
        cy.getByTestId('account-dropdown').click();
        cy.getByTestId('active-account-nickname').should('contain', accountName);
    });
});
