describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  const location = window.location;
  const origin =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it('close the intro info box', () => {
    cy.findByText('Close Intro').click();
    cy.findByText('Close Intro').should('not.exist');
  });

  it('Close Intro from this computer', () => {
    cy.visit('/');
    cy.findByText('How to Use This Application').should('exist');
    cy.findByRole('checkbox', {
      name: "Don't show again on this computer",
    }).click({ force: true });
    cy.findByText('Close Intro').click();
    cy.visit('/');
    cy.findByText('How to Use This Application').should('not.exist');
  });

  it('Verify localStorage showIntro Value', () => {
    cy.visit('/');
    cy.findByText('How to Use This Application').should('exist');
    cy.findByRole('checkbox', {
      name: "Don't show again on this computer",
    })
      .click({ force: true })
      .then(() => {
        expect(localStorage.getItem('showIntro')).to.eq('false');
      });
    cy.findByRole('checkbox', {
      name: "Don't show again on this computer",
    })
      .click({ force: true })
      .then(() => {
        expect(localStorage.getItem('showIntro')).to.eq('true');
      });
  });

  it('Clear Search button is available when data profile is selected', () => {
    cy.selectProfile('Actions');
    cy.findByRole('button', { name: 'Clear Search' });
  });

  it('Data profile Sources query link', () => {
    cy.selectProfile('Sources');
    cy.url().should('include', '/attains/sources');
  });

  it('All data profile option are select one by one and check Clear Search button is available ', () => {
    const profiles = [
      'Actions',
      'Assessment Units',
      'Assessments',
      'Assessment Units with Monitoring Locations',
      'Catchment Correspondence',
      'Sources',
      'Total Maximum Daily Load',
    ];
    profiles.forEach((profile) => {
      cy.selectProfile(profile);
      cy.findByRole('button', { name: 'Clear Search' });
    });
  });

  it('searching with a <script> tag displays no option', () => {
    const search = '<script>var j = 1;</script>';
    cy.get(`[aria-label="Select a data profile"]`).type(search);
    cy.get('#react-select-instance-select-data-profile-listbox')
      .children('div')
      .should('contain.text', 'No options');
    cy.get('body').click(0, 0);
  });

  // for new query structure, this verify is not necessary
  it('Verify url by selecting different format', () => {
    cy.selectProfile('Actions');
    cy.findByText('Comma-separated (CSV)').click();
    cy.url().should('include', 'attains/actions');
    cy.findByText('Tab-separated (TSV)').click();
    cy.url().should('include', 'attains/actions');
    cy.findByText('Microsoft Excel (XLSX)').click();
    cy.url().should('include', 'attains/actions');
  });

  it('Verify Clear Search button after clear', () => {
    cy.selectProfile('Actions');
    cy.findByRole('button', { name: 'Clear Search' }).click({ force: true });
    cy.wait(2000);
    cy.findByText('Continue').should('exist');
    cy.findByText('Cancel').should('exist').click();
  });

  it('Verify Download Status Pop-up with stubing api', () => {
    cy.selectProfile('Actions');
    cy.intercept('POST', `${origin}/api/attains/actions/count`, {
      count: '510',
    }).as('api-response');

    cy.findByRole('button', { name: 'Download' }).click();
    cy.wait(2000);
    cy.findByTestId('downloadfile-length').contains('510');

    // closing button X
    cy.get(`[aria-label="Close this window"]`).should('exist');

    cy.findByText('Continue').should('exist');
    cy.findByText('Click continue to download the data.').should('exist');
    cy.findByText('Cancel').should('exist').click();
    cy.get('.usa-modal__main').should('not.exist');
  });

  it('Verify disabled button when count is zero', () => {
    cy.selectProfile('Assessments');
    cy.intercept('POST', `${origin}/api/attains/assessments/count`, {
      count: 0,
    }).as('assessments-count');
    cy.findByRole('button', { name: 'Download' }).click();

    cy.wait('@assessments-count');
    cy.findByRole('button', { name: 'Continue' }).should('be.disabled');
    cy.findByRole('button', { name: 'Cancel' }).click();
  });

  it('Verify url after clear the query', () => {
    cy.selectProfile('Sources');
    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'SD-BA-L-FREEMAN_01');

    //Confirmed
    cy.findByRole('checkbox', { name: 'No' }).click({ force: true });

    cy.url().should(
      'equal',
      `${origin}/attains/sources#assessmentUnitId=SD-BA-L-FREEMAN_01&confirmed=N`,
    );

    cy.findAllByRole('button', { name: 'Clear Search' }).each(
      ($elem, index) => {
        index === 0 && cy.wrap($elem).click({ force: true });
      },
    );
    cy.wait(2000);
    cy.findByText('Continue').should('exist').click();
    cy.url().should('equal', `${origin}/attains/sources`);
  });

  it('Verify file format after clear the query', () => {
    cy.selectProfile('Assessment Units');
    cy.findByRole('button', { name: 'Advanced API Queries' }).click();

    //State
    cy.selectOption('input-state', 'texas');

    //Assessment Unit Status
    cy.findByRole('checkbox', { name: 'Active' }).click({ force: true });
    cy.findByRole('checkbox', { name: 'Retired' }).click({ force: true });

    //File Format
    cy.findByText('Tab-separated (TSV)').click();

    const columnsValue =
      'columns=objectId&columns=region&columns=state&columns=organizationType&columns=organizationId&columns=organizationName&columns=waterType&columns=locationTypeCode&columns=locationText&columns=useClassName&columns=assessmentUnitId&columns=assessmentUnitName&columns=assessmentUnitStatus&columns=reportingCycle&columns=cycleId&columns=locationDescription&columns=sizeSource&columns=sourceScale&columns=waterSize&columns=waterSizeUnits';

    const queryValue = `/api/attains/assessmentUnits?${columnsValue}&assessmentUnitStatus=R&state=TX&format=tsv&api_key=<YOUR_API_KEY>`;
    cy.selectCopyBox('api-query-copy-box-container', `${origin}${queryValue}`);

    cy.findAllByRole('button', { name: 'Clear Search' }).each(
      ($elem, index) => {
        index === 0 && cy.wrap($elem).click({ force: true });
      },
    );
    cy.wait(2000);
    cy.findByText('Continue').should('exist').click();

    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessmentUnits?${columnsValue}&assessmentUnitStatus=A&format=tsv&api_key=<YOUR_API_KEY>`,
    );
  });
});
