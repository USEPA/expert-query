import { clientUrl, serverUrl } from '../constants';

describe('API Documentation and API key Signup Pages', () => {
  it('Verify link to api documentation page through UI', () => {
    cy.visit('/');
    cy.selectProfile('Actions');
    cy.findByRole('button', { name: 'Advanced Queries' }).click();

    cy.findByRole('link', { name: 'API Documentation' })
      .should('be.visible')
      .should('have.attr', 'href', `${clientUrl}/api-documentation`);
  });

  it('Navigate directly to api documentation page', () => {
    cy.visit('/api-documentation');
    cy.findByRole('link', { name: `${serverUrl}/api/openapi` }).should(
      'be.visible',
    );
    cy.findByRole('link', { name: 'ATTAINS - Actions' }).should('be.visible');
  });

  it('Verify link to apikey signup page through UI', () => {
    cy.visit('/api-documentation');
    cy.get('.opblock-summary-control').first().click();

    cy.findByRole('link', { name: 'obtain their own API key' })
      .filter(':visible')
      .should('have.attr', 'href', '/expertquery/api-key-signup');
  });

  it('Navigate directly to api key signup page', () => {
    cy.visit('/api-key-signup');
    cy.findByText('Sign up for an application programming interface (API)', {
      exact: false,
    }).should('be.visible');
  });
});
