describe('404 Page', () => {
  it('404 Redirect', () => {
    cy.visit('/bogus-route');
    cy.url().should('eq', 'http://localhost:3002/404.html?src=http://localhost:3000/bogus-route');
    cy.findByRole('heading', { name: 'Sorry, but this web page does not exist.' }).should('be.visible')
  });
});