// This is a workaround for making the tests more reliable when running
// cypress in headless mode, particularly for running code coverage.
// This also helps weed out some of the false errors from ArcGIS.
Cypress.on('uncaught:exception', (_err, _runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  return false;
});


describe('404 Page', () => {
  it('404 Redirect', () => {
    cy.visit('/bogus-route');
    cy.url().should('eq', 'http://localhost:3002/404.html?src=http://localhost:3000/bogus-route');
    cy.findByRole('heading', { name: 'Sorry, but this web page does not exist.' }).should('be.visible')
  });

  it('404 Redirect non-existent profile', () => {
    cy.wait(500);
    cy.visit('/attains/bogus-route');
    cy.url().should('eq', 'http://localhost:3002/404.html?src=http://localhost:3000/attains/bogus-route');
    cy.findByRole('heading', { name: 'Sorry, but this web page does not exist.' }).should('be.visible')
  });

  it('Error when lookupFiles service is down', () => {
    cy.intercept('http://localhost:3002/api/lookupFiles', {
      statusCode: 500,
      body: {},
    }).as('eq-lookupFiles');

    cy.visit('/');

    cy.findByText(
      "Expert Query is currently unavailable, please try again later.",
    );
  });
});