describe('bookings step 1::scbp_core.tests.cypress.app.booking.BookingProcessTestCase', () => {
    beforeEach(() => {
        cy.login('client@localhost.dev');
    });
    it('should show one way and hourly options', () => {
        cy.visitApp();
        cy.get('.ant-tabs-tabpane-active').within(() => {
            cy.getByText('Your first pickup address:').should('exist');
            cy.getByText('Your final destination:').should('exist');
            cy.contains('Duration:').should('not.exist');
        });
        cy.getByText('Hourly').click();
        cy.get('.ant-tabs-tabpane-active').within(() => {
            cy.getByText('Your first pickup address:').should('exist');
            cy.getByText('Duration:').should('exist');
            cy.contains('Where to:').should('not.exist');
        });
    });

    it('address toggle should work', () => {
        cy.visitApp();
        cy.getByText('Hourly').click();
        cy.get('.ant-tabs-tabpane-active').within(() => {
            cy.contains('Flight number').should('not.exist');
            cy.getByTitle('Melbourne Airport').click();
            cy.getByText('Flight number').should('exist');
            cy.getByTitle('Home').click();
            cy.contains('Flight number').should('not.exist');
        });
    });

    it('validation should work', () => {
        cy.visitApp();
        cy.getByText('Next').click({ force: true });
        cy.getAllByText(
            "Sorry, we can't find that address. Try again or call 1300 12 LIMO to book over the phone"
        ).should('have.length', 2);
        cy.getByText('Please select travel date and time').should('exist');
    });
});

describe('bookings step 1 passenger select::scbp_core.tests.cypress.app.booking.BookingPassengerSelectTestCase', () => {
    beforeEach(() => {
        cy.window().then(win => {
            win.sessionStorage.clear();
        });
        cy.server();
        cy.route('GET', '/rad-api/scbp_core.clientaddress/*').as('listAddresses');
        cy.route('GET', '/rad-api/scbp_core.account/*/passenger-list/').as('listPassengers');
        cy.route('POST', '/rad-api/scbp_core.writeonlybooking/validate-step/').as(
            'validateBooking'
        );
        cy.route('POST', '/rad-api/scbp_core.writeonlybooking/create-booking/').as('createBooking');
    });
    it('should not show passenger select if not logged in', () => {
        cy.visitApp();
        cy.getByTestId('one-way-trip-tab').click();
        cy.contains('Passenger:').should('not.exist');
        cy.enterAddress('address-pickup', '234 Whitehorse Road');
        cy.enterAddress('address-destination', '229 Springfield Road');
        cy.getByPlaceholderText('Select date').click();
        cy.get('.ant-calendar-next-month-btn').click();
        cy.get('.ant-calendar-date')
            .contains('1')
            .click();
        cy.getTimeWidgetByLabel('Time').setTime(12, 30);
        // Make sure we can get through next step without selecting passenger info
        cy.getByText('Next').click({ force: true });
        cy.wait('@validateBooking');
        cy.url().should(
            'eq',
            Cypress.config().baseUrl + Cypress.config().appUrlPart + 'car-class/'
        );
        // Make sure we can go all the way, login, and complete a booking without having
        // to go back to first step and select passenger
        cy.getAllByText('Next')
            .first()
            .click({ force: true });
        cy.wait('@validateBooking');
        cy.url().should('eq', Cypress.config().baseUrl + Cypress.config().appUrlPart + 'options/');
        cy.getAllByText('Next')
            .first()
            .click({ force: true });
        cy.wait('@validateBooking');
        cy.url().should('eq', Cypress.config().baseUrl + Cypress.config().appUrlPart + 'summary/');

        cy.getByText('Sign in to submit your booking request').click({
            force: true,
        });
        cy.getByPlaceholderText('Email address').type('client1@localhost.dev');
        cy.getByPlaceholderText('Password').type('password{enter}');
        cy.getByText('Submit booking request').click({ force: true });
        cy.getByText('Your booking is complete').should('exist');
    });
    it('should show passenger select', () => {
        cy.login('client1@localhost.dev');
        cy.visitApp();
        cy.getByTestId('one-way-trip-tab').click({ force: true });
        cy.wait('@listAddresses');
        cy.getByTestId('passenger-select').should('contain', 'Richard Cheese');
        cy.getByTestId('address-pickup').within(() => {
            cy.getByTitle('Home').click();
            cy.getByPlaceholderText('Enter a location').should(
                'have.value',
                '234 Whitehorse Road, Nunawading VIC 3131'
            );
        });
        // Changing passenger should have their address instead
        cy.getByTestId('passenger-select').selectAntOption('Bob Smith');
        cy.wait('@listAddresses');
        cy.getByTestId('passenger-select').should('contain', 'Bob Smith');
        cy.getByTestId('address-pickup').within(() => {
            cy.getByText('Clear').click({ force: true });
            cy.getByTitle('Home').click();
            cy.getByPlaceholderText('Enter a location').should(
                'have.value',
                '175 Maroondah Highway, Ringwood VIC 3134'
            );
        });
        // Changing passenger to custom should use current user address
        cy.getByTestId('passenger-select').selectAntOption('Guest');
        cy.getByPlaceholderText('Passenger Phone Number').should('exist');
        cy.getByTestId('address-pickup').within(() => {
            cy.getByText('Clear').click({ force: true });
            cy.getByTitle('Home').click();
            cy.getByPlaceholderText('Enter a location').should(
                'have.value',
                '234 Whitehorse Road, Nunawading VIC 3131'
            );
        });
        cy.enterAddress('address-destination', '229 Springfield Road');
        cy.getByPlaceholderText('Select date').click();
        cy.get('.ant-calendar-next-month-btn').click();
        cy.get('.ant-calendar-date')
            .contains('1')
            .click();
        cy.getTimeWidgetByLabel('Time').setTime(12, 30);
        cy.getByText('Next').click({ force: true });
        cy.wait('@validateBooking');
        cy.getByText('Please enter a name for the passenger').should('exist');
        cy.getByText('Please enter a phone number for the passenger').should('exist');
        cy.getByTestId('passenger-name').within(() => {
            cy.get('input').type('Tim the Terrible');
        });
        cy.getByPlaceholderText('Passenger Phone Number').type('0412 666 666');
        cy.getByText('Next').click({ force: true });
        cy.wait('@validateBooking');
        cy.url().should(
            'eq',
            Cypress.config().baseUrl + Cypress.config().appUrlPart + 'car-class/'
        );
        cy.getAllByText('Next')
            .first()
            .click({ force: true });
        cy.wait('@validateBooking');
        cy.url().should('eq', Cypress.config().baseUrl + Cypress.config().appUrlPart + 'options/');
        cy.getAllByText('Next')
            .first()
            .click({ force: true });
        cy.wait('@validateBooking');
        cy.url().should('eq', Cypress.config().baseUrl + Cypress.config().appUrlPart + 'summary/');
        cy.getByText('Submit booking request').click({ force: true });
        cy.wait('@createBooking');
        cy.getByText('Your booking is complete').should('exist');
    });
    it('should allow saving of guests', () => {
        cy.login('client1@localhost.dev');
        cy.visitApp();
        cy.getByTestId('one-way-trip-tab').click();
        cy.wait('@listAddresses');
        cy.wait('@listPassengers');
        cy.getByTestId('passenger-select').selectAntOption('Guest');
        cy.getByTestId('passenger-name').within(() => {
            cy.get('input').type('Tim the Terrible');
        });
        cy.getByPlaceholderText('Passenger Phone Number').type('0412 666 666');
        cy.getByText('Save to guest list').click({ force: true });
        cy.getByText('Saved').should('exist');
        // Should be able to reload and select the saved record
        cy.reload();
        cy.getByTestId('passenger-select').selectAntOption('Guest');
        cy.getByText('Tim the Terrible').click();
        cy.getByPlaceholderText('Passenger Phone Number').should('have.value', '0412 666 666');
    });
});
