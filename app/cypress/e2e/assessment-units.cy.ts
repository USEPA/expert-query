describe('Data Profile Assessment Units', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.selectProfile('Assessment Units');
    cy.findByRole('button', { name: 'Advanced API Queries' }).click();
  });

  const columnsValue = 'columns=objectId&columns=region&columns=state&columns=organizationType&columns=organizationId&columns=organizationName&columns=waterType&columns=locationTypeCode&columns=locationText&columns=useClassName&columns=assessmentUnitId&columns=assessmentUnitName&columns=assessmentUnitStatus&columns=reportingCycle&columns=cycleId&columns=locationDescription&columns=sizeSource&columns=sourceScale&columns=waterSize&columns=waterSizeUnits';
  const columnsValueCurl = '\"columns\":[\"objectId\",\"region\",\"state\",\"organizationType\",\"organizationId\",\"organizationName\",\"waterType\",\"locationTypeCode\",\"locationText\",\"useClassName\",\"assessmentUnitId\",\"assessmentUnitName\",\"assessmentUnitStatus\",\"reportingCycle\",\"cycleId\",\"locationDescription\",\"sizeSource\",\"sourceScale\",\"waterSize\",\"waterSizeUnits\"]';

  const location = window.location;
  const origin =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it('Verify copy box text flavor 1', () => {
    const queryValue = 'assessmentUnitStatus=A';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnits#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessmentUnits?${columnsValue}&${queryValue}&format=csv`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitStatus":["A"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessmentUnits`,
    );
  });

  it('Verify copy box text flavor 2', () => {
    //Assessment Unit State
    cy.findByRole('checkbox', { name: 'Active' }).click({ force: true });
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
      `${origin}/api/attains/assessmentUnits?${columnsValue}&${queryValue}&format=csv`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["AL-Gulf-of-Mexico-2"],"assessmentUnitStatus":["R"],"locationText":["Buffalo County"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessmentUnits`,
    );
  });

  it('Verify copy box text flavor 3', () => {
    //Assessment Unit State
    cy.findByRole('checkbox', { name: 'Active' }).click({ force: true });
    cy.findByRole('checkbox', { name: 'Retired' }).click({ force: true });

    //Organization ID
    cy.selectOption('input-organizationId', 'wisconsin');

    //Water Type
    cy.selectOption('input-waterType', 'ocean');

    //File Format
    cy.findByText('Tab-separated (TSV)').click();

    const queryValue =
      'assessmentUnitStatus=R&organizationId=WIDNR&waterType=OCEAN';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnits#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessmentUnits?${columnsValue}&${queryValue}&format=tsv`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitStatus":["R"],"organizationId":["WIDNR"],"waterType":["OCEAN"]},"options":{"format":"tsv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessmentUnits`,
    );
  });

  it('Verify copy box text flavor 4', () => {
    //Assessment Unit State
    cy.findByRole('checkbox', { name: 'Active' }).click({ force: true });
    cy.findByRole('checkbox', { name: 'Historical' }).click({ force: true });
    cy.findByRole('checkbox', { name: 'Active' }).click({ force: true });

    //Organization Id
    cy.selectOption('input-organizationId', 'montana');

    //Use Class Name
    cy.selectOption('input-useClassName', 'a-1');

    //Water Type
    cy.selectOption('input-waterType', 'pond');

    //File Format
    cy.findByText('Microsoft Excel (XLSX)').click();

    const queryValue =
      'assessmentUnitStatus=H&assessmentUnitStatus=A&organizationId=MTDEQ&useClassName=A-1&waterType=LAKE/RESERVOIR/POND';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnits#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessmentUnits?${columnsValue}&${queryValue}&format=xlsx`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitStatus":["H","A"],"organizationId":["MTDEQ"],"useClassName":["A-1"],"waterType":["LAKE/RESERVOIR/POND"]},"options":{"format":"xlsx"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessmentUnits`,
    );
  });

  it('Verify copy box text flavor 5', () => {
    //Assessment Unit State
    cy.findByRole('checkbox', { name: 'Retired' }).click({ force: true });
    cy.findByRole('checkbox', { name: 'Historical' }).click({ force: true });

    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'AL-Gulf-of-Mexico-2');
    cy.selectOption('input-assessmentUnitId', 'archibald lake');

    //Location Text
    cy.selectOption('input-locationText', 'green county');

    //Organization ID
    cy.selectOption('input-organizationId', 'okdeq');
    cy.selectOption('input-organizationId', 'tennessee');

    //State
    cy.selectOption('input-state', 'colorado');

    //Region
    cy.selectOption('input-region', '05');

    //Use Class Name
    cy.selectOption('input-useClassName', 'se3');

    //Water Type
    cy.selectOption('input-waterType', 'flowage');

    //File Format
    cy.findByText('Microsoft Excel (XLSX)').click();

    const queryValue =
      'assessmentUnitId=AL-Gulf-of-Mexico-2&assessmentUnitId=WI10000917&assessmentUnitStatus=A&assessmentUnitStatus=R&assessmentUnitStatus=H&locationText=Green%20County&organizationId=OKDEQ&organizationId=TDECWR&region=05&state=CO&useClassName=SE3&waterType=FLOWAGE';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnits#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessmentUnits?${columnsValue}&${queryValue}&format=xlsx`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["AL-Gulf-of-Mexico-2","WI10000917"],"assessmentUnitStatus":["A","R","H"],"locationText":["Green County"],"organizationId":["OKDEQ","TDECWR"],"region":["05"],"state":["CO"],"useClassName":["SE3"],"waterType":["FLOWAGE"]},"options":{"format":"xlsx"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessmentUnits`,
    );
  });
});
