describe('Data Profile Assessment Units with Monitoring Locations', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.selectProfile('Assessment Units with Monitoring Locations');
    cy.findByRole('button', { name: 'Advanced Queries' }).click();
  });

  const columnsValue =
    'columns=objectId&columns=region&columns=state&columns=organizationType&columns=organizationId&columns=organizationName&columns=waterType&columns=useClassName&columns=monitoringLocationId&columns=monitoringLocationOrgId&columns=assessmentUnitId&columns=assessmentUnitName&columns=assessmentUnitStatus&columns=reportingCycle&columns=cycleId&columns=locationDescription&columns=monitoringLocationDataLink&columns=sizeSource&columns=sourceScale&columns=waterSize&columns=waterSizeUnits';
  const columnsValueCurl =
    '"columns":["objectId","region","state","organizationType","organizationId","organizationName","waterType","useClassName","monitoringLocationId","monitoringLocationOrgId","assessmentUnitId","assessmentUnitName","assessmentUnitStatus","reportingCycle","cycleId","locationDescription","monitoringLocationDataLink","sizeSource","sourceScale","waterSize","waterSizeUnits"]';

  const location = window.location;
  const origin =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it('Verify copy box text flavor 1', () => {
    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnitsMonitoringLocations?assessmentUnitStatus=A`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessmentUnitsMonitoringLocations?${columnsValue}&assessmentUnitStatus=A&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitStatus":["A"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessmentUnitsMonitoringLocations -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 2', () => {
    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'dn_am_watershed');
    cy.selectOption('input-assessmentUnitId', 'american creek');

    const queryValue =
      'assessmentUnitId=DN_AM_Watershed&assessmentUnitId=AK_R_8031116_001&assessmentUnitStatus=A';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnitsMonitoringLocations?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessmentUnitsMonitoringLocations?${columnsValue}&${queryValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["DN_AM_Watershed","AK_R_8031116_001"],"assessmentUnitStatus":["A"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessmentUnitsMonitoringLocations -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 3', () => {
    //Assessment Unit Status
    cy.findByRole('checkbox', { name: 'Active' }).click({ force: true });
    cy.findByRole('checkbox', { name: 'Historical' }).click({ force: true });

    //Monitoring Location Organization ID
    cy.selectOption('input-monitoringLocationOrgId', 'tswqc_wqx');

    //Use Class Name
    cy.selectOption('input-useClassName', 'non-class');

    //File Format
    cy.findByText('Microsoft Excel (XLSX)').click();

    const queryValue =
      'assessmentUnitStatus=H&monitoringLocationOrgId=TSWQC_WQX&useClassName=NON-CLASS';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnitsMonitoringLocations?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessmentUnitsMonitoringLocations?${columnsValue}&${queryValue}&format=xlsx&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitStatus":["H"],"monitoringLocationOrgId":["TSWQC_WQX"],"useClassName":["NON-CLASS"]},"options":{"format":"xlsx"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessmentUnitsMonitoringLocations -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 4', () => {
    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'delawarenation-1300');

    //Assessment Unit Status
    cy.findByRole('checkbox', { name: 'Active' }).click({ force: true });
    cy.findByRole('checkbox', { name: 'Historical' }).click({ force: true });

    //Organization ID
    cy.selectOption('input-organizationId', '21pa');

    //Reporting Cycle
    cy.selectOption('input-reportingCycle', 'latest');

    //Water Type
    cy.selectOption('input-waterType', 'harbor');

    //File Format
    cy.findByText('Comma-separated (CSV)').click();

    const queryValue =
      'assessmentUnitId=DELAWARENATION-1300&assessmentUnitStatus=H&organizationId=21PA&waterType=GREAT%20LAKES%20BAYS%20AND%20HARBORS';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnitsMonitoringLocations?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessmentUnitsMonitoringLocations?${columnsValue}&${queryValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["DELAWARENATION-1300"],"assessmentUnitStatus":["H"],"organizationId":["21PA"],"waterType":["GREAT LAKES BAYS AND HARBORS"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessmentUnitsMonitoringLocations -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 5', () => {
    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'dn_am_watershed');
    cy.selectOption('input-assessmentUnitId', 'ashley lake');

    //Monitoring Location ID
    cy.selectOption('input-monitoringLocationId', 'f01a21');

    //Monitoring Location Organization ID
    cy.selectOption('input-monitoringLocationOrgId', '21awic');

    //Organization ID
    cy.selectOption('input-organizationId', 'redlake');
    cy.selectOption('input-organizationId', 'georgia');

    //State
    cy.selectOption('input-state', 'kentucky');

    //Region
    cy.selectOption('input-region', '04');

    //Reporting Cycle
    cy.selectOption('input-reportingCycle', 'latest');

    //Use Class Name
    cy.selectOption('input-useClassName', 'vii');

    //Water Type
    cy.selectOption('input-waterType', 'harbor');

    const queryValue =
      'assessmentUnitId=DN_AM_Watershed&assessmentUnitId=FL2543D&assessmentUnitStatus=A&monitoringLocationId=F01A21%20%20%20%20%20%20%20%20%20&monitoringLocationOrgId=21AWIC&organizationId=REDLAKE&organizationId=21GAEPD&region=04&state=KY&useClassName=VII&waterType=GREAT%20LAKES%20BAYS%20AND%20HARBORS';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessmentUnitsMonitoringLocations?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessmentUnitsMonitoringLocations?${columnsValue}&${queryValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["DN_AM_Watershed","FL2543D"],"assessmentUnitStatus":["A"],"monitoringLocationId":["F01A21         "],"monitoringLocationOrgId":["21AWIC"],"organizationId":["REDLAKE","21GAEPD"],"region":["04"],"state":["KY"],"useClassName":["VII"],"waterType":["GREAT LAKES BAYS AND HARBORS"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessmentUnitsMonitoringLocations -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });
});
