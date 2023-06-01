describe('National Downloads page', () => {
  beforeEach(() => {
    cy.visit('/national-downloads');
  });

  it('Displays a table row for each ATTAINS data profile', () => {
    cy.findByRole('link', { name: 'Actions Profile' }).should('be.visible');
    cy.findByRole('link', { name: 'Assessments Profile' }).should('be.visible');
    cy.findByRole('link', { name: 'Assessment Units Profile' }).should(
      'be.visible',
    );
    cy.findByRole('link', {
      name: 'Assessment Units with Monitoring Locations Profile',
    }).should('be.visible');
    cy.findByRole('link', { name: 'Catchment Correspondence Profile' }).should(
      'be.visible',
    );
    cy.findByRole('link', { name: 'Sources Profile' }).should('be.visible');
    cy.findByRole('link', { name: 'Total Maximum Daily Load Profile' }).should(
      'be.visible',
    );
  });
});
