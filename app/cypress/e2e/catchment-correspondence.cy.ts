describe('Data Profile Catchment Correspondence', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.selectProfile('Catchment Correspondence');
    cy.findByRole('button', { name: 'Advanced Queries' }).click();
  });

  const columnsValue =
    'columns=objectId&columns=region&columns=state&columns=organizationType&columns=organizationId&columns=organizationName&columns=assessmentUnitId&columns=assessmentUnitName&columns=catchmentNhdPlusId&columns=reportingCycle&columns=cycleId';
  const columnsValueCurl =
    '"columns":["objectId","region","state","organizationType","organizationId","organizationName","assessmentUnitId","assessmentUnitName","catchmentNhdPlusId","reportingCycle","cycleId"]';

  const location = window.location;
  const origin =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it('Verify copy box text flavor 1', () => {
    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/catchmentCorrespondence?`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/catchmentCorrespondence?${columnsValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/catchmentCorrespondence -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 2', () => {
    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'as-04o');

    //Organization ID
    cy.selectOption('input-organizationId', '21hi');

    const queryValue = 'assessmentUnitId=AS-04O&organizationId=21HI';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/catchmentCorrespondence?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/catchmentCorrespondence?${columnsValue}&${queryValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["AS-04O"],"organizationId":["21HI"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/catchmentCorrespondence -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 3', () => {
    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'hillabee creek');

    //Organization ID
    cy.selectOption('input-organizationId', 'california');

    //File Format
    cy.findByText('Tab-separated (TSV)').click();

    const queryValue =
      'assessmentUnitId=AL03150106-0503-101&organizationId=CA_SWRCB';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/catchmentCorrespondence?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/catchmentCorrespondence?${columnsValue}&${queryValue}&format=tsv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["AL03150106-0503-101"],"organizationId":["CA_SWRCB"]},"options":{"format":"tsv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/catchmentCorrespondence -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 4', () => {
    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'as-04o');

    //Organization ID
    cy.selectOption('input-organizationId', 'montana');

    //Reporting Cycle
    cy.selectOption('input-reportingCycle', '2018{downArrow}');

    //File Format
    cy.findByText('Microsoft Excel (XLSX)').click();

    const queryValue =
      'assessmentUnitId=AS-04O&organizationId=MTDEQ&reportingCycle=2018';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/catchmentCorrespondence?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/catchmentCorrespondence?${columnsValue}&${queryValue}&format=xlsx&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["AS-04O"],"organizationId":["MTDEQ"],"reportingCycle":2018},"options":{"format":"xlsx"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/catchmentCorrespondence -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 5', () => {
    //Reporting Cycle
    cy.selectOption('input-reportingCycle', '2016{downArrow}');

    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'as-01o');
    cy.selectOption('input-assessmentUnitId', 'aasu-ocean');

    //Organization ID
    cy.selectOption('input-organizationId', '21pa');
    cy.selectOption('input-organizationId', 'california');

    //State
    cy.selectOption('input-state', 'texas');

    //Region
    cy.selectOption('input-region', '06');

    //File Format
    cy.findByText('Tab-separated (TSV)').click();

    const queryValue =
      'assessmentUnitId=AS-01O&assessmentUnitId=AS-07O&organizationId=21PA&organizationId=CA_SWRCB&region=06&reportingCycle=2016&state=TX';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/catchmentCorrespondence?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/catchmentCorrespondence?${columnsValue}&${queryValue}&format=tsv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["AS-01O","AS-07O"],"organizationId":["21PA","CA_SWRCB"],"region":["06"],"reportingCycle":2016,"state":["TX"]},"options":{"format":"tsv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/catchmentCorrespondence -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });
});
