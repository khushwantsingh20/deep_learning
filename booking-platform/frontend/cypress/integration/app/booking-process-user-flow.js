describe('bookings process user flow::scbp_core.tests.cypress.app.booking.BookingProcessTestCase', () => {
    beforeEach(() => {
        cy.window().then(win => {
            win.sessionStorage.clear();
        });
        cy.server();
        cy.route('POST', '/rad-api/scbp_core.writeonlybooking/validate-step/').as(
            'validateBooking'
        );
        cy.route('POST', '/rad-api/scbp_core.writeonlybooking/create-booking/').as('createBooking');
        cy.route('GET', '/rad-api/scbp_core.vehicleclass/*').as('listVehicleClass');
        cy.route('GET', '/rad-api/scbp_core.writeonlybooking/price-options/').as('priceOptions');
        cy.visitApp();
        cy.wait('@listVehicleClass');
        cy.wait('@priceOptions');
        cy.getByTestId('one-way-trip-tab').click();

        // For all test cases here use same details - we just want to test the final page
        cy.enterAddress('address-pickup', '234 Whitehorse Road');
        cy.enterAddress('address-destination', '229 Springfield Road');
        cy.getByPlaceholderText('Select date').click();
        cy.get('.ant-calendar-next-month-btn').click();
        cy.get('.ant-calendar-date')
            .contains('1')
            .click();
        cy.getTimeWidgetByLabel('Time').setTime(12, 30);
        cy.getByText('Next').click({ force: true });
        cy.wait('@validateBooking');
        cy.getByText('Any Class').should('exist');
        cy.getAllByText('Next')
            .first()
            .click({ force: true });
        cy.wait('@validateBooking');
        cy.getByText('Optional Extras Total:').should('exist');
        cy.getAllByText('Next')
            .first()
            .click({ force: true });
        cy.wait('@validateBooking');
    });
    it('should handle user login as part of booking process (existing billing account)', () => {
        cy.getByText('Sign in to submit your booking request').click({
            force: true,
        });
        cy.getByPlaceholderText('Email address').type('client+withaccount@localhost.dev');
        cy.getByPlaceholderText('Password').type('password{enter}');
        cy.getByText('Submit booking request').click();
        cy.wait('@createBooking');
        cy.getByText('Your booking is complete').should('exist');
    });
    it('should handle user login as part of booking process (create billing account)', () => {
        cy.getByText('Sign in to submit your booking request').click({
            force: true,
        });
        cy.getByPlaceholderText('Email address').type('client@localhost.dev');
        cy.getByPlaceholderText('Password').type('password{enter}');
        cy.getByText('Create account').should('exist');
        cy.getByLabelText('Personal').click();
        const accountName = 'Account the first';
        cy.getByLabelText('Account Nickname').type(accountName);
        cy.getByText('Add Credit Card').click({ force: true });
        cy.fillCreditCard();
        cy.getByText('Assign Card').click({ force: true });
        cy.getByText('Last four digits:').should('exist');
        cy.getByTestId('create-account-button').click();
        cy.getByText('Submit booking request').click();
        cy.wait('@createBooking');
        cy.getByText('Your booking is complete').should('exist');
    });
    it('should handle user registration as part of booking process', () => {
        cy.getByText('Sign in to submit your booking request').click({
            force: true,
        });
        cy.get('.ant-tabs-nav').within(() => {
            cy.getByText('Register').click();
        });
        cy.getByLabelText('Title').type('Mr');
        cy.getByLabelText('First name').type('A');
        cy.getByLabelText('Last name').type('B');
        cy.getByLabelText('Email address').type('newclient@localhost.dev');
        cy.getByLabelText('Phone (mobile)').type('0412777777');
        const password = 'uiadosijf332424';
        cy.getByLabelText('Password').type(password);
        cy.getByLabelText('Confirm password').type(`${password}{enter}`);
        cy.getByText('Create account').should('exist');
        cy.getByLabelText('Personal').click();
        const accountName = 'Account the first';
        cy.getByLabelText('Account Nickname').type(accountName);
        cy.getByText('Add Credit Card').click({ force: true });
        cy.fillCreditCard();
        cy.getByText('Assign Card').click({ force: true });
        cy.getByText('Last four digits:').should('exist');
        cy.getByTestId('create-account-button').click();
        cy.getByText('Submit booking request').click();
        cy.wait('@createBooking');
        cy.getByText('Your booking is complete').should('exist');
    });
});
