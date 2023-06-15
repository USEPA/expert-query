describe('Data Profile Total Maximum Daily Load', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.selectProfile('Total Maximum Daily Load');
    cy.findByRole('button', { name: 'Advanced Queries' }).click();
  });

  const columnsValue =
    'columns=objectId&columns=region&columns=state&columns=organizationType&columns=organizationId&columns=organizationName&columns=waterType&columns=pollutantGroup&columns=pollutant&columns=addressedParameterGroup&columns=addressedParameter&columns=sourceType&columns=npdesIdentifier&columns=otherIdentifier&columns=actionId&columns=actionName&columns=actionAgency&columns=inIndianCountry&columns=explicitMarginOfSafety&columns=implicitMarginOfSafety&columns=includeInMeasure&columns=completionDate&columns=tmdlDate&columns=fiscalYearEstablished&columns=assessmentUnitId&columns=assessmentUnitName&columns=loadAllocation&columns=loadAllocationUnits&columns=locationDescription&columns=tmdlEndpoint&columns=waterSize&columns=waterSizeUnits&columns=wasteLoadAllocation';
  const columnsValueCurl =
    '"columns":["objectId","region","state","organizationType","organizationId","organizationName","waterType","pollutantGroup","pollutant","addressedParameterGroup","addressedParameter","sourceType","npdesIdentifier","otherIdentifier","actionId","actionName","actionAgency","inIndianCountry","explicitMarginOfSafety","implicitMarginOfSafety","includeInMeasure","completionDate","tmdlDate","fiscalYearEstablished","assessmentUnitId","assessmentUnitName","loadAllocation","loadAllocationUnits","locationDescription","tmdlEndpoint","waterSize","waterSizeUnits","wasteLoadAllocation"]';

  const location = window.location;
  const origin =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it('Verify copy box text flavor 1', () => {
    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/tmdl?`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/tmdl?${columnsValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/tmdl -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 2', () => {
    //Action Agency
    cy.findByRole('checkbox', { name: 'EPA' }).click({ force: true });

    //NPDES ID
    cy.selectOption('input-npdesIdentifier', '477001');

    const queryValue = 'actionAgency=EPA&npdesIdentifier=477001';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/tmdl?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/tmdl?${columnsValue}&${queryValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"actionAgency":["EPA"],"npdesIdentifier":["477001"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/tmdl -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 3', () => {
    //Action Name
    cy.selectOption('input-actionId', 'ks big blue');

    //Completion Date
    cy.get('#input-completionDateLo').type('1955-10-03');
    cy.get('#input-completionDateHi').type('1992-12-18');

    //Explicit Margin of Safety
    cy.selectOption('input-explicitMarginOfSafety', '10.3 acre');

    //Fiscal Year Established
    cy.get('#input-fiscalYearEstablishedLo').type('1984');
    cy.get('#input-fiscalYearEstablishedHi').type('2023');

    //Implicit Margin of Safety
    cy.selectOption('input-implicitMarginOfSafety', 'implicit due');

    //NPDES ID
    cy.selectOption('input-npdesIdentifier', '477001');

    //Source Type
    cy.findByRole('checkbox', { name: 'Point / Nonpoint source' }).click({
      force: true,
    });

    //TMDL Date
    cy.get('#input-tmdlDateLo').type('1956-01-04');
    cy.get('#input-tmdlDateHi').type('2020-07-11');

    const queryValue =
      'actionId=R7_KS_2020_00204&completionDateLo=10-03-1955&completionDateHi=12-18-1992&explicitMarginOfSafety=10.3%20acre-feet%20per%20year&fiscalYearEstablishedLo=1984&fiscalYearEstablishedHi=2023&implicitMarginOfSafety=Implicit%20due%20to%20conservative%20assumptions&npdesIdentifier=477001&sourceType=Both&tmdlDateLo=01-04-1956&tmdlDateHi=07-11-2020';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/tmdl?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/tmdl?${columnsValue}&${queryValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"actionId":["R7_KS_2020_00204"],"completionDateLo":"10-03-1955","completionDateHi":"12-18-1992","explicitMarginOfSafety":["10.3 acre-feet per year"],"fiscalYearEstablishedLo":"1984","fiscalYearEstablishedHi":"2023","implicitMarginOfSafety":["Implicit due to conservative assumptions"],"npdesIdentifier":["477001"],"sourceType":["Both"],"tmdlDateLo":"01-04-1956","tmdlDateHi":"07-11-2020"},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/tmdl -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 4', () => {
    //Action Agency
    cy.findByRole('checkbox', { name: 'EPA' }).click({ force: true });

    //Action ID
    cy.selectOption('input-actionId', 'ia7001');
    cy.selectOption('input-actionId', 'cannonball river - from snake');

    //Completion Date
    cy.get('#input-completionDateLo').type('1987-11-02');
    cy.get('#input-completionDateHi').type('1991-12-16');

    //Fiscal Year Established
    cy.get('#input-fiscalYearEstablishedLo').type('2014');
    cy.get('#input-fiscalYearEstablishedHi').type('2018');

    //In Indian Country
    cy.findAllByRole('checkbox', { name: 'Yes' }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : '';
    });

    //Organization ID
    cy.selectOption('input-organizationId', '21sc60wq');
    cy.selectOption('input-organizationId', 'oklahoma');

    //Other Identifier
    cy.selectOption('input-otherIdentifier', 'city of belvue');

    //Source Type
    cy.findByRole('checkbox', { name: 'Nonpoint source' }).click({
      force: true,
    });

    //TMDL Date
    cy.get('#input-tmdlDateLo').type('1993-08-05');
    cy.get('#input-tmdlDateHi').type('1994-03-09');

    //File Format
    cy.findByText('Tab-separated (TSV)').click();

    const queryValue =
      'actionAgency=EPA&actionId=IA7001&actionId=11624&completionDateLo=11-02-1987&completionDateHi=12-16-1991&fiscalYearEstablishedLo=2014&fiscalYearEstablishedHi=2018&includeInMeasure=Y&organizationId=21SC60WQ&organizationId=OKDEQ&otherIdentifier=City%20of%20Belvue&sourceType=Nonpoint%20source&tmdlDateLo=08-05-1993&tmdlDateHi=03-09-1994';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/tmdl?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/tmdl?${columnsValue}&${queryValue}&format=tsv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"actionAgency":["EPA"],"actionId":["IA7001","11624"],"completionDateLo":"11-02-1987","completionDateHi":"12-16-1991","fiscalYearEstablishedLo":"2014","fiscalYearEstablishedHi":"2018","includeInMeasure":["Y"],"organizationId":["21SC60WQ","OKDEQ"],"otherIdentifier":["City of Belvue"],"sourceType":["Nonpoint source"],"tmdlDateLo":"08-05-1993","tmdlDateHi":"03-09-1994"},"options":{"format":"tsv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/tmdl -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box text flavor 5', () => {
    //Action Agency
    cy.findByRole('checkbox', { name: 'Tribal' }).click({ force: true });

    //Action ID
    cy.selectOption('input-actionId', '35772');
    cy.selectOption('input-actionId', 'bear creek');

    //Addressed Parameter
    cy.selectOption('input-addressedParameter', 'algae');

    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'fl1382g');
    cy.selectOption('input-assessmentUnitId', 'hackberry cr');

    //Completion Date
    cy.get('#input-completionDateLo').type('2009-12-08');
    cy.get('#input-completionDateHi').type('2017-09-08');

    //Explicit Margin of Safety
    cy.selectOption('input-explicitMarginOfSafety', '1.21E');

    //Fiscal Year Established
    cy.get('#input-fiscalYearEstablishedLo').type('2008');
    cy.get('#input-fiscalYearEstablishedHi').type('2019');

    //Implicit Margin of Safety
    cy.selectOption('input-implicitMarginOfSafety', 'tss target based');

    //Include in Measure
    cy.findAllByRole('checkbox', { name: 'Yes' }).each(($elem, index) => {
      index === 0 ? cy.wrap($elem).click({ force: true }) : '';
    });

    //In Indian Country
    cy.findAllByRole('checkbox', { name: 'No' }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : '';
    });

    //NPDES ID
    cy.selectOption('input-npdesIdentifier', '59925');

    //Organization ID
    cy.selectOption('input-organizationId', '21kan001');
    cy.selectOption('input-organizationId', 'florida');

    //Other Identifier
    cy.selectOption('input-otherIdentifier', 'bpu');

    //Pollutant
    cy.selectOption('input-pollutant', 'cfc-113');

    //Region
    cy.selectOption('input-region', '06');

    //Source Type
    cy.findByRole('checkbox', { name: 'Point source' }).click({ force: true });

    //TMDL Date
    cy.get('#input-tmdlDateLo').type('2019-12-08');
    cy.get('#input-tmdlDateHi').type('2022-09-30');

    //Water Type
    cy.selectOption('input-waterType', 'harbor');

    const queryValue =
      'actionAgency=Tribal&actionId=35772&actionId=11593&addressedParameter=ALGAE&assessmentUnitId=FL1382G&assessmentUnitId=KS-102500033&completionDateLo=12-08-2009&completionDateHi=09-08-2017&explicitMarginOfSafety=1.21E+09&fiscalYearEstablishedLo=2008&fiscalYearEstablishedHi=2019&implicitMarginOfSafety=TSS%20target%20based%20on%20the%2025th%20percentile%20concentration%20of%20all%20USGS%20TSS%20data%20from%20Missouri%20in%20the%20EDU%20where%20Mound%20Branch%20is%20located.&includeInMeasure=N&inIndianCountry=Y&npdesIdentifier=59925&organizationId=21KAN001&organizationId=21FL303D&otherIdentifier=BPU%20Kaw%20Power%20Station&pollutant=CFC-113&region=06&sourceType=Point%20source&tmdlDateLo=12-08-2019&tmdlDateHi=09-30-2022&waterType=GREAT%20LAKES%20BAYS%20AND%20HARBORS';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/tmdl?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/tmdl?${columnsValue}&${queryValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"actionAgency":["Tribal"],"actionId":["35772","11593"],"addressedParameter":["ALGAE"],"assessmentUnitId":["FL1382G","KS-102500033"],"completionDateLo":"12-08-2009","completionDateHi":"09-08-2017","explicitMarginOfSafety":["1.21E+09"],"fiscalYearEstablishedLo":"2008","fiscalYearEstablishedHi":"2019","implicitMarginOfSafety":["TSS target based on the 25th percentile concentration of all USGS TSS data from Missouri in the EDU where Mound Branch is located."],"includeInMeasure":["N"],"inIndianCountry":["Y"],"npdesIdentifier":["59925"],"organizationId":["21KAN001","21FL303D"],"otherIdentifier":["BPU Kaw Power Station"],"pollutant":["CFC-113"],"region":["06"],"sourceType":["Point source"],"tmdlDateLo":"12-08-2019","tmdlDateHi":"09-30-2022","waterType":["GREAT LAKES BAYS AND HARBORS"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/tmdl -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });
});
