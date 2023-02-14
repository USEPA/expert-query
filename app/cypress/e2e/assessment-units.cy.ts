describe('Data Profile Assessment Units', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.selectProfile('Assessment Units');
    cy.findByRole('button', { name: 'Advanced API Queries' }).click();
  });

  const location = window.location;
  const origin =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it('Verify copy box text flavor 1', () => {
    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnits#`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/attains/data/assessmentUnits?format=csv`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{},"options":{"format":"csv"}}',
      )} ${origin}/attains/data/assessmentUnits`,
    );
  });

  it('Verify copy box text flavor 2', () => {
    //Assessment Unit State
    cy.findByRole('checkbox', { name: 'Retired' }).click({ force: true });

    //Location Text
    cy.selectOption('input-locationText', 'buffalo county');

    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'AL-Gulf-of-Mexico-2');

    const queryValue =
      'assessmentUnitId=AL-Gulf-of-Mexico-2&assessmentUnitStatus=R&locationText=Buffalo%20County';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnits#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/attains/data/assessmentUnits?${queryValue}&format=csv`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentUnitId":["AL-Gulf-of-Mexico-2"],"assessmentUnitStatus":["R"],"locationText":["Buffalo County"]},"options":{"format":"csv"}}',
      )} ${origin}/attains/data/assessmentUnits`,
    );
  });

  it('Verify copy box text flavor 3', () => {
    //Assessment Unit State
    cy.findByRole('checkbox', { name: 'Retired' }).click({ force: true });

    //Organization Name
    cy.selectOption('input-organizationName', 'wisconsin');

    //Water Type
    cy.selectOption('input-waterType', 'ocean');

    //File Format
    cy.findByText('Tab-separated (TSV)').click();

    const queryValue =
      'assessmentUnitStatus=R&organizationName=Wisconsin&waterType=OCEAN';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnits#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/attains/data/assessmentUnits?${queryValue}&format=tsv`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentUnitStatus":["R"],"organizationName":["Wisconsin"],"waterType":["OCEAN"]},"options":{"format":"tsv"}}',
      )} ${origin}/attains/data/assessmentUnits`,
    );
  });

  it('Verify copy box text flavor 4', () => {
    //Assessment Unit State
    cy.findByRole('checkbox', { name: 'Historical' }).click({ force: true });
    cy.findByRole('checkbox', { name: 'Active' }).click({ force: true });

    //Organization Name
    cy.selectOption('input-organizationName', 'montana');

    //Use Class Name
    cy.selectOption('input-useClassName', 'a-1');

    //Water Type
    cy.selectOption('input-waterType', 'pond');

    //File Format
    cy.findByText('Microsoft Excel (XLSX)').click();

    const queryValue =
      'assessmentUnitStatus=H&assessmentUnitStatus=A&organizationName=Montana&useClassName=A-1&waterType=LAKE/RESERVOIR/POND';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnits#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/attains/data/assessmentUnits?${queryValue}&format=xlsx`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentUnitStatus":["H","A"],"organizationName":["Montana"],"useClassName":["A-1"],"waterType":["LAKE/RESERVOIR/POND"]},"options":{"format":"xlsx"}}',
      )} ${origin}/attains/data/assessmentUnits`,
    );
  });

  it('Verify copy box text flavor 5', () => {
    //Assessment Unit State
    cy.findByRole('checkbox', { name: 'Active' }).click({ force: true });
    cy.findByRole('checkbox', { name: 'Retired' }).click({ force: true });
    cy.findByRole('checkbox', { name: 'Historical' }).click({ force: true });

    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'AL-Gulf-of-Mexico-2');

    //Assessment Unit Name
    cy.selectOption('input-assessmentUnitName', 'archibald lake');

    //Location Text
    cy.selectOption('input-locationText', 'green county');

    //Organization ID
    cy.selectOption('input-organizationId', 'okdeq');

    //Organization Name
    cy.selectOption('input-organizationName', 'tennessee');

    //Region
    cy.selectOption('input-region', '05');

    //State
    cy.selectOption('input-state', 'colorado');

    //Use Class Name
    cy.selectOption('input-useClassName', 'se3');

    //Water Type
    cy.selectOption('input-waterType', 'flowage');

    //File Format
    cy.findByText('Microsoft Excel (XLSX)').click();

    const queryValue =
      'assessmentUnitId=AL-Gulf-of-Mexico-2&assessmentUnitName=Archibald%20Lake&assessmentUnitStatus=A&assessmentUnitStatus=R&assessmentUnitStatus=H&locationText=Green%20County&organizationId=OKDEQ&organizationName=Tennessee&region=05&state=CO&useClassName=SE3&waterType=FLOWAGE';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnits#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/attains/data/assessmentUnits?${queryValue}&format=xlsx`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentUnitId":["AL-Gulf-of-Mexico-2"],"assessmentUnitName":["Archibald Lake"],"assessmentUnitStatus":["A","R","H"],"locationText":["Green County"],"organizationId":["OKDEQ"],"organizationName":["Tennessee"],"region":["05"],"state":["CO"],"useClassName":["SE3"],"waterType":["FLOWAGE"]},"options":{"format":"xlsx"}}',
      )} ${origin}/attains/data/assessmentUnits`,
    );
  });
});
