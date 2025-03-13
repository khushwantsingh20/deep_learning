Cypress.Commands.add('killServer', () => {
    cy.request('/cypress/kill/');
});

Cypress.Commands.add('rollback', () => {
    cy.request('/cypress/rollback/');
});

Cypress.Commands.add('restartServer', () => {
    cy.exec('cat ./django-root/.pid', { failOnNonZeroExit: true }).then(result => {
        const oldpid = result.stdout;
        cy.log('about to kill');
        cy.killServer();
        cy.log('just killed');
        cy.exec('./bin/waitrestart.sh ' + oldpid);
    });
});

Cypress.Commands.add('pyAssert', what => {
    cy.request({
        url: '/cypress/call/' + what + '/',
        failOnStatusCode: false,
    }).then(resp => {
        if (resp.status === 500) {
            for (const line of resp.body.split('\n')) {
                cy.log(line);
            }

            cy.log('Terminating Test.').then(() => {
                assert.isTrue(resp.status === 500, what);
            });
        } else {
            assert.isTrue(resp.status === 200, what);
        }
    });
});

Cypress.Commands.add('loadData', what => {
    cy.request('/cypress/call/' + what + '/');
});

Cypress.Commands.add('djangoLogin', username => {
    cy.request('GET', '/cypress/login/' + username + '/');
});

Cypress.Commands.add('visitApp', (url = '') => {
    if (url && url[url.length - 1] !== '/') {
        url += '/';
    }
    cy.visit(`${Cypress.config().appUrlPart}${url}`);
});

Cypress.Commands.add('visitAdmin', (url = '') => {
    if (url && url[url.length - 1] !== '/') {
        url += '/';
    }
    cy.visit(`${Cypress.config().adminUrlPart}${url}`);
});
