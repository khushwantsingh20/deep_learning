// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// eslint-disable-next-line import/no-extraneous-dependencies
import './commands';
import './djangoCypressCommands';

// https://github.com/cypress-io/cypress/issues/95
Cypress.on('window:before:load', win => {
    win.fetch = null;
});

// Disable screenshots for failed tests
Cypress.Screenshot.defaults({
    screenshotOnRunFailure: false,
});

// eslint-disable-next-line func-names
beforeEach(function() {
    cy.rollback();
    cy.setCookie('welcome', '1');

    const suiteTitle = this.currentTest.parent.title;
    if (suiteTitle.indexOf('::') !== -1) {
        const what = suiteTitle.substring(suiteTitle.lastIndexOf('::') + 2);
        cy.loadData(what + '.setUpTestData');
    }

    const testTitle = this.currentTest.title;
    if (testTitle.indexOf('::') !== -1) {
        const what = testTitle.substring(testTitle.lastIndexOf('::') + 2);
        cy.loadData(what + '.setUpTestData');
    }
});
