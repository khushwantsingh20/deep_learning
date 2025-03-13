import moment from 'moment';
import '@testing-library/cypress/add-commands';

/**
 * Performs a logout on the server and ensures the session is cleared
 */
Cypress.Commands.add('logout', () => {
    // Need to ensure that the previous session was properly ended
    cy.request('logout/');
    cy.window().then(win => win.sessionStorage.clear());
});

/**
 * Performs a login on the server
 */
Cypress.Commands.add('login', reqUserName => {
    const userName = reqUserName || 'admin@localhost.dev';

    cy.logout();

    cy.djangoLogin(userName);
});

/**
 * Returns a promise that resolves to the json result of an api call.
 * Can be used like:
 * cy.wait('@getLoans')
 *   .then(cy.parseJsonXHR)
 *   .then(body => {
 *     console.log(body);
 *   });
 */
Cypress.Commands.add(
    'parseJsonXHR',
    xhr =>
        new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(JSON.parse(reader.result));
            };
            reader.readAsBinaryString(xhr.responseBody);
        })
);

/**
 * Select an option in an Ant.Design select component by label.  Ant.Design
 * does not use regular select elements and is a non-trivial structure to
 * interact with.
 *
 * Can be used to interact with the component by:
 *  a.) clicking the option in the dropdown; or
 *  b.) typing the text in the input (as in a combo-box)
 *
 * Example:
 * cy.get('#select-element')
 *   .selectAntOption('the option', method='type');
 */
Cypress.Commands.add(
    'selectAntOption',
    { prevSubject: 'element' },
    (subject, value, method = 'click') => {
        if (subject.length !== 1) {
            throw new Error('Can only select values on a single ant select at a time');
        }
        subject.click();

        if (method === 'type') {
            // eslint-disable-next-line cypress/no-assigning-return-values
            const searchField = cy.wrap(subject).find('.ant-select-search__field');
            searchField.type(value);
            // wait for typing debouncer on widget, the corresponding option should become "active" (not selected)
            cy.wrap(Cypress.$('.ant-select-dropdown-menu')).contains(
                '.ant-select-dropdown-menu-item-active',
                value
            );
            searchField.type('{enter}');
        } else {
            // The Ant select dropdown is appended to the dom tree so let's retrieve it
            // with jQuery in case this command is used within a Cypress within() statement
            cy.wrap(
                Cypress.$(`.ant-select-dropdown-menu li:contains(${CSS.escape(value)})`)
            ).click();
        }

        // wrap() seems to be necessary here due to multiple cy commands called in this command
        return cy.wrap(subject);
    }
);

/**
 * Determine the currently selected option.
 *
 * Example:
 * cy.get('#select-element')
 *   .selectedAntOption()
 *   .should('be', 'the expected option');
 */
Cypress.Commands.add('selectedAntOption', { prevSubject: 'element' }, subject => {
    if (subject.length !== 1) {
        // calling text() on a jquery collection will be the text from all items concatenated together
        throw new Error('Can only retrieve the value on a single ant select at a time');
    }
    return subject.find('.ant-select-selection-selected-value').text();
});

/**
 * Set the date on an Ant.Design datepicker
 *
 * Example:
 * cy.get('#date-field')
 *   .setAntDate('26th October 1985')
 */
Cypress.Commands.add('setAntDate', { prevSubject: 'element' }, (subject, value) => {
    if (subject.length !== 1) {
        throw new Error('Can only select values on a single ant select at a time');
    }

    subject.find('input').click();
    return cy.wrap(Cypress.$('.ant-calendar-input')).type(value);
});

/**
 * Convenience command to get the save button in a djRad form (whose text is wrapped in a <span>!)
 */
Cypress.Commands.add('getSaveButton', () => {
    cy.getByText('SAVE').parent();
});

/**
 * Convenience command to get the delete button on a delete confirmation page
 */
Cypress.Commands.add('getDeleteButton', () => {
    cy.getByText('Yes, I’m sure').parent();
});

/**
 * Convenience command to get the value of a djRad detail field denoted by the given title
 */
Cypress.Commands.add('getField', title => cy.contains('div.djrad--detail-grid-view--field', title));

/**
 * Convenience command for clicking on an action link in a standard djRad list
 */
Cypress.Commands.add('actionItem', (action, listSelector, itemData, forceClick) => {
    const options = {};
    if (forceClick) {
        options.force = true;
    }
    cy.get(listSelector)
        .contains(itemData)
        .closest('tr')
        .contains(action)
        .click(options);
});

/**
 * Convenience command for viewing the details of an item in a standard djRad list
 */
Cypress.Commands.add('viewItem', (listSelector, itemData, forceClick) => {
    cy.actionItem('View', listSelector, itemData, forceClick);
});

/**
 * Convenience command for updating the details of an item in a standard djRad list
 */
Cypress.Commands.add('updateItem', (listSelector, itemData, forceClick) => {
    cy.actionItem('Update', listSelector, itemData, forceClick);
});

/**
 * Convenience command for deleting the details of an item in a standard djRad list
 */
Cypress.Commands.add('deleteItem', (listSelector, itemData, forceClick) => {
    cy.actionItem('Delete', listSelector, itemData, forceClick);
});

/**
 * Convenience command for selecting a djRad form item based on it's label
 */
Cypress.Commands.add('getFormItemByLabelText', label =>
    cy
        .get('div.ant-form-item-label > label')
        .contains(label)
        .closest('div.ant-form-item')
);

/**
 * Convenience command for selecting a djRad multi-select form item based on it's label
 */
Cypress.Commands.add('getMultiSelectByLabelText', label =>
    cy.getFormItemByLabelText(label).find('div.ant-transfer')
);

/**
 * Command to add selected items for a multi-select in djRad
 */
Cypress.Commands.add('addMultiSelectItems', { prevSubject: 'element' }, (multiSelect, items) => {
    cy.wrap(multiSelect)
        .find('ul.ant-transfer-list-content')
        .first()
        .within(() => {
            items.forEach(item => {
                cy.get(`.ant-transfer-list-content-item[title="${item}"] label`).click();
            });
        });
    cy.wrap(multiSelect)
        .find('.anticon-right')
        .parent('button')
        .click();
});

/**
 * Command to remove selected items for a multi-select in djRad
 */
Cypress.Commands.add('removeMultiSelectItems', { prevSubject: 'element' }, (multiSelect, items) => {
    cy.wrap(multiSelect)
        .find('ul.ant-transfer-list-content')
        .last()
        .within(() => {
            items.forEach(item => {
                cy.get(`.ant-transfer-list-content-item[title="${item}"] label`).click();
            });
        });
    cy.wrap(multiSelect)
        .find('.anticon-left')
        .parent('button')
        .click();
});

/**
 * Select a time widget by label
 */
Cypress.Commands.add('getTimeWidgetByLabel', label =>
    cy
        .get('div.ant-form-item-label > label')
        .contains(label)
        .parent('div.ant-form-item-label')
        .next()
);

/**
 * Select a time from a time widget (excluding seconds - if seconds are required,
 * use setTimeWithSeconds)
 * The refactor of the time widget in KB234 broke the existing tests,
 * which need to be refactored to use the new widget.
 */
Cypress.Commands.add('setTime', { prevSubject: 'element' }, (subject, hour, minute) => {
    if (subject.length !== 1) {
        throw new Error('Can only select one time at a time');
    }
    const displayTime = moment({ hour, minute });
    cy.wrap(subject)
        .find('.TimeWidgetSelectHourWrapper > div.ant-select')
        .first()
        .selectAntOption(displayTime.format('h A'));
    cy.wrap(subject)
        .find('.TimeWidgetSelectMinuteWrapper > div.ant-select')
        .first()
        .selectAntOption(displayTime.format('mm'));
});

/**
 * Select a time from a time widget with seconds (if the widget is not expected
 * to have seconds, use setTime)
 * Will fail if the widget does not have showSeconds set to true
 */
Cypress.Commands.add(
    'setTimeWithSeconds',
    { prevSubject: 'element' },
    (subject, hour, minute, second) => {
        cy.wrap(subject).setTime(hour, minute);
        const displayTime = moment({ hour, minute, second });
        cy.wrap(subject)
            .find('.TimeWidgetSelectSecondWrapper > div.ant-select')
            .first()
            .selectAntOption(displayTime.format('ss'));
    }
);

/**
 * Usage:
 *  cy.get('.__PrivateStripeElement > iframe')
 *   .iframeEl('body input[name="cardnumber"]')
 *   .type('4000000360000006');
 *
 * https://github.com/cypress-io/cypress/issues/136#issuecomment-516215770
 * Requires "chromeWebSecurity": false, in cypress.json
 */
Cypress.Commands.add('iframeEl', { prevSubject: 'element' }, ($iframe, selector) => {
    Cypress.log({
        name: 'iframe',
        consoleProps() {
            return {
                iframe: $iframe,
            };
        },
    });
    const iframeDoc = $iframe[0].contentDocument;
    return new Cypress.Promise((resolve, reject) => {
        const timeoutId = setTimeout(
            () => reject(new Error('iframe did not load or element not found')),
            5000
        );
        const resolveWithEl = () => {
            clearTimeout(timeoutId);
            resolve($iframe.contents().find(selector));
        };
        if ('complete' === iframeDoc.readyState) {
            if ($iframe.contents().find(selector).length === 0) {
                // This was an edge case that _could_ be specific to Stripe
                // iframe but I have no way of knowing. readyState would say
                // ready but document hadn't actually fully loaded - adding
                // a load listener here worked. This does mean that if the
                // element is legitamately not found _and_ the document has
                // actually loaded we will force timeout as load will never
                // run... but this should be a rare case
                $iframe.on('load', () => {
                    resolveWithEl();
                });
            } else {
                resolveWithEl();
            }
        } else {
            $iframe.on('load', () => {
                resolveWithEl();
            });
        }
    });
});

Cypress.Commands.add('enterAddress', (container, address) => {
    cy.getByTestId(container).within(() =>
        cy.getByPlaceholderText('Enter a location').type(address)
    );
    cy.get('.pac-item:first-child').should('contain', address);
    // I hate doing this but it's too unreliable in CI... seeing if this helps
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(100);
    cy.getByTestId(container).within(() => {
        cy.getByPlaceholderText('Enter a location').type('{downarrow}{enter}');
    });
});

Cypress.Commands.add('fillCreditCard', () => {
    const d = new Date();
    const expiry = `10/${(d.getFullYear() + 1).toString().substr(-2)}`;
    cy.getByPlaceholderText('Name on card').type('Augustus McCormick');
    cy.getByPlaceholderText('Card number').type('4000000360000006');
    cy.getByPlaceholderText('MM/YY').type(expiry);
    cy.getByPlaceholderText('CVV').type('123');
});
