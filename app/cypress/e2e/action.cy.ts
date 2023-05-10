describe('Data Profile Action', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.selectProfile('Actions');
    cy.findByRole('button', { name: 'Advanced API Queries' }).click();
  });

  const columnsValue = 'columns=objectId&columns=region&columns=state&columns=organizationType&columns=organizationId&columns=organizationName&columns=waterType&columns=parameter&columns=actionType&columns=actionId&columns=actionName&columns=actionAgency&columns=inIndianCountry&columns=includeInMeasure&columns=completionDate&columns=assessmentUnitId&columns=assessmentUnitName&columns=locationDescription&columns=waterSize&columns=waterSizeUnits';
  const columnsValueCurl = '\"columns\":[\"objectId\",\"region\",\"state\",\"organizationType\",\"organizationId\",\"organizationName\",\"waterType\",\"parameter\",\"actionType\",\"actionId\",\"actionName\",\"actionAgency\",\"inIndianCountry\",\"includeInMeasure\",\"completionDate\",\"assessmentUnitId\",\"assessmentUnitName\",\"locationDescription\",\"waterSize\",\"waterSizeUnits\"]';

  const location = window.location;
  const origin =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it('Verify copy box text flavor 1', () => {
    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/actions#`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/actions?${columnsValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/actions -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 2', () => {
    //Action Agency
    cy.findByRole('checkbox', { name: 'State' }).click({ force: true });

    //Action ID
    cy.selectOption('input-actionId', '10081');
    cy.selectOption('input-actionId', '56325');

    const queryValue = 'actionAgency=State&actionId=10081&actionId=56325';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/actions#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/actions?${columnsValue}&${queryValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"actionAgency":["State"],"actionId":["10081","56325"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/actions -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 3', () => {
    //Action Agency
    cy.findByRole('checkbox', { name: 'EPA' }).click({ force: true });

    //Region
    cy.selectOption('input-region', '06');
    cy.selectOption('input-region', '09');

    //File Format
    cy.findByText('Tab-separated (TSV)').click();

    const queryValue = 'actionAgency=EPA&region=06&region=09';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/actions#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/actions?${columnsValue}&${queryValue}&format=tsv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"actionAgency":["EPA"],"region":["06","09"]},"options":{"format":"tsv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/actions -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 4', () => {
    //Action Agency
    cy.findByRole('checkbox', { name: 'Tribal' }).click({ force: true });

    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'as-10s');
    cy.selectOption('input-assessmentUnitId', 'as-05s');

    //Water Type
    cy.selectOption('input-waterType', 'wash');
    cy.selectOption('input-waterType', 'harbor');

    //File Format
    cy.findByText('Microsoft Excel (XLSX)').click();

    const queryValue =
      'actionAgency=Tribal&assessmentUnitId=AS-10S&assessmentUnitId=AS-05S&waterType=WASH&waterType=GREAT%20LAKES%20BAYS%20AND%20HARBORS';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/actions#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/actions?${columnsValue}&${queryValue}&format=xlsx&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"actionAgency":["Tribal"],"assessmentUnitId":["AS-10S","AS-05S"],"waterType":["WASH","GREAT LAKES BAYS AND HARBORS"]},"options":{"format":"xlsx"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/actions -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box Current Query text flavor 5', () => {
    //Action Agency
    cy.findByRole('checkbox', { name: 'Tribal' }).click({ force: true });
    cy.findByRole('checkbox', { name: 'EPA' }).click({ force: true });

    //Action ID
    cy.selectOption('input-actionId', '10081');
    cy.selectOption('input-actionId', '10817');
    cy.selectOption('input-actionId', 'alder gulch');
    cy.selectOption('input-actionId', 'nelson creek');

    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'as-03O');
    cy.selectOption('input-assessmentUnitId', 'as-04s');

    //Organization ID
    cy.selectOption('input-organizationId', 'california');
    cy.selectOption('input-organizationId', 'montana');
    cy.selectOption('input-organizationId', '21ky');

    //Water Type
    cy.selectOption('input-waterType', 'gulf');

    // File Format
    cy.findByText('Microsoft Excel (XLSX)').click();

    const queryValue =
      'actionAgency=Tribal&actionAgency=EPA&actionId=10081&actionId=10817&actionId=41897&actionId=39736&assessmentUnitId=AS-03O&assessmentUnitId=AS-04S&organizationId=CA_SWRCB&organizationId=MTDEQ&organizationId=21KY&waterType=GULF';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/actions#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/actions?${columnsValue}&${queryValue}&format=xlsx&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"actionAgency":["Tribal","EPA"],"actionId":["10081","10817","41897","39736"],"assessmentUnitId":["AS-03O","AS-04S"],"organizationId":["CA_SWRCB","MTDEQ","21KY"],"waterType":["GULF"]},"options":{"format":"xlsx"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/actions -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });
});
