describe('Data Profile Sources', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.selectProfile('Sources');
    cy.findByRole('button', { name: 'Advanced Queries' }).click();
  });

  const columnsValue =
    'columns=objectId&columns=region&columns=state&columns=organizationType&columns=organizationId&columns=organizationName&columns=waterType&columns=assessmentUnitId&columns=assessmentUnitName&columns=reportingCycle&columns=overallStatus&columns=epaIrCategory&columns=stateIrCategory&columns=parameterGroup&columns=causeName&columns=sourceName&columns=confirmed&columns=cycleId&columns=locationDescription&columns=waterSize&columns=waterSizeUnits';
  const columnsValueCurl =
    '"columns":["objectId","region","state","organizationType","organizationId","organizationName","waterType","assessmentUnitId","assessmentUnitName","reportingCycle","overallStatus","epaIrCategory","stateIrCategory","parameterGroup","causeName","sourceName","confirmed","cycleId","locationDescription","waterSize","waterSizeUnits"]';

  const location = window.location;
  const origin =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it('Verify copy box text flavor 1', () => {
    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/sources?`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/sources?${columnsValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/sources -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 2', () => {
    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'SD-BA-L-FREEMAN_01');

    //Confirmed
    cy.findByRole('checkbox', { name: 'No' }).click({ force: true });

    const queryValue = 'assessmentUnitId=SD-BA-L-FREEMAN_01&confirmed=N';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/sources?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/sources?${columnsValue}&${queryValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["SD-BA-L-FREEMAN_01"],"confirmed":["N"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/sources -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 3', () => {
    //Assessment Unit Id
    cy.selectOption('input-assessmentUnitId', 'agency creek');

    //Confirmed
    cy.findByRole('checkbox', { name: 'No' }).click({ force: true });

    //Organization ID
    cy.selectOption('input-organizationId', 'pueblooftesuque');
    cy.selectOption('input-organizationId', 'district');

    //Overall Status
    cy.selectOption('input-overallStatus', 'fully');

    //Parameter Group
    cy.selectOption('input-parameterGroup', 'pesticides');

    //Reporting Cycle
    cy.selectOption('input-reportingCycle', '2017{downArrow}');

    //Source Name
    cy.selectOption('input-sourceName', 'groundwater');

    //Water Type
    cy.selectOption('input-waterType', 'wetlands, tidal');

    //File Format
    cy.findByText('Microsoft Excel (XLSX)').click();

    const queryValue =
      'assessmentUnitId=TN06020002001_0100&confirmed=N&organizationId=PUEBLOOFTESUQUE&organizationId=DOEE&overallStatus=Fully%20Supporting&parameterGroup=PESTICIDES&reportingCycle=2017&sourceName=BASEFLOW%20DEPLETION%20FROM%20GROUNDWATER%20WITHDRAWALS&waterType=WETLANDS,%20TIDAL';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/sources?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/sources?${columnsValue}&${queryValue}&format=xlsx&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["TN06020002001_0100"],"confirmed":["N"],"organizationId":["PUEBLOOFTESUQUE","DOEE"],"overallStatus":["Fully Supporting"],"parameterGroup":["PESTICIDES"],"reportingCycle":2017,"sourceName":["BASEFLOW DEPLETION FROM GROUNDWATER WITHDRAWALS"],"waterType":["WETLANDS, TIDAL"]},"options":{"format":"xlsx"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/sources -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 4', () => {
    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'MT40Q001_011');
    cy.selectOption('input-assessmentUnitId', 'abbie creek');

    //Confirmed
    cy.findByRole('checkbox', { name: 'No' }).click({ force: true });

    //Organization ID
    cy.selectOption('input-organizationId', 'wisconsin');

    //Overall Status
    cy.selectOption('input-overallStatus', 'not supporting');

    //Parameter Group
    cy.selectOption('input-parameterGroup', 'nutrients');

    //Reporting Cycle
    cy.selectOption('input-reportingCycle', '2018{downArrow}');

    //Source Name
    cy.selectOption('input-sourceName', 'manure lagoons');

    //State
    cy.selectOption('input-state', 'hawaii');

    //Water Type
    cy.selectOption('input-waterType', 'wash');

    //File Format
    cy.findByText('Comma-separated (CSV)').click();

    const queryValue =
      'assessmentUnitId=MT40Q001_011&assessmentUnitId=AL03130004-0405-100&confirmed=N&organizationId=WIDNR&overallStatus=Not%20Supporting&parameterGroup=NUTRIENTS&reportingCycle=2018&sourceName=MANURE%20LAGOONS&state=HI&waterType=WASH';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/sources?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/sources?${columnsValue}&${queryValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["MT40Q001_011","AL03130004-0405-100"],"confirmed":["N"],"organizationId":["WIDNR"],"overallStatus":["Not Supporting"],"parameterGroup":["NUTRIENTS"],"reportingCycle":2018,"sourceName":["MANURE LAGOONS"],"state":["HI"],"waterType":["WASH"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/sources -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 5', () => {
    //Reporting Cycle
    cy.selectOption('input-reportingCycle', '2016{downArrow}');

    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'AL-Gulf-of-Mexico-2');
    cy.selectOption('input-assessmentUnitId', 'American Fork');

    //Cause Name
    cy.selectOption('input-causeName', 'ammonia');

    //Confirmed
    cy.findByRole('checkbox', { name: 'Yes' }).click({ force: true });

    //EPA IR Category
    cy.selectOption('input-epaIrCategory', '4a');

    //Organization ID
    cy.selectOption('input-organizationId', '21pa');
    cy.selectOption('input-organizationId', 'south dakota');

    //Overall Status
    cy.selectOption('input-overallStatus', 'fully');

    //Parameter Group
    cy.selectOption('input-parameterGroup', 'trash');

    //State
    cy.selectOption('input-state', 'florida');

    //Region
    cy.selectOption('input-region', '06');

    //Source Name
    cy.selectOption('input-sourceName', 'pipeline');

    //State IR Category
    cy.selectOption('input-stateIrCategory', 'biological');

    //Water Type
    cy.selectOption('input-waterType', 'inland');

    //File Format
    cy.findByText('Tab-separated (TSV)').click();

    const queryValue =
      'assessmentUnitId=AL-Gulf-of-Mexico-2&assessmentUnitId=MT40A002_120&causeName=AMMONIA&confirmed=Y&epaIrCategory=4A&organizationId=21PA&organizationId=SDDENR&overallStatus=Fully%20Supporting&parameterGroup=TRASH&region=06&reportingCycle=2016&sourceName=PIPELINE%20BREAKS&state=FL&stateIrCategory=5b-t&waterType=INLAND%20BEACH';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/sources?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/sources?${columnsValue}&${queryValue}&format=tsv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitId":["AL-Gulf-of-Mexico-2","MT40A002_120"],"causeName":["AMMONIA"],"confirmed":["Y"],"epaIrCategory":["4A"],"organizationId":["21PA","SDDENR"],"overallStatus":["Fully Supporting"],"parameterGroup":["TRASH"],"region":["06"],"reportingCycle":2016,"sourceName":["PIPELINE BREAKS"],"state":["FL"],"stateIrCategory":["5b-t"],"waterType":["INLAND BEACH"]},"options":{"format":"tsv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/sources -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });
});
