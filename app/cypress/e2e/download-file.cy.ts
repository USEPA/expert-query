describe('Download file', () => {
  before(() => {
    cy.visit('/');
  });

  let count = '0';
  it('Download and Verify Alert message visible when download and dismissed after other interaction', () => {
    cy.selectProfile('Assessments');
    cy.selectOption('input-state', 'north carolina');
    cy.selectOption('input-assessmentUnitId', 'NC10-1-35-(2)b');
    cy.selectOption('input-assessmentUnitId', 'NC10-1-35-4');
    cy.findByRole('button', { name: 'Download' }).click();
    cy.wait(2000);
    cy.findByText('Continue').should('exist');
    cy.findByTestId('downloadfile-length').then(($el) => {
      count = $el.text();
    });
    cy.findByText('Continue').click();
    cy.findByText('Query executed successfully', { exact: false }).should(
      'exist',
    );

    // Change an option to clear the success message
    cy.findByText('Tab-separated (TSV)').click();

    cy.findByText('Query executed successfully', { exact: false }).should(
      'not.exist',
    );
  });
});
