describe('Data Profile Assessments', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.selectProfile('Assessments');
    cy.findByRole('button', { name: 'Advanced Queries' }).click();
  });

  const columnsValue =
    'columns=objectId&columns=region&columns=state&columns=organizationType&columns=organizationId&columns=organizationName&columns=waterType&columns=reportingCycle&columns=cycleLastAssessed&columns=assessmentUnitId&columns=assessmentUnitName&columns=assessmentUnitStatus&columns=overallStatus&columns=epaIrCategory&columns=stateIrCategory&columns=useGroup&columns=useName&columns=useClassName&columns=useSupport&columns=useIrCategory&columns=useStateIrCategory&columns=monitoringStartDate&columns=monitoringEndDate&columns=assessmentDate&columns=assessmentTypes&columns=assessmentMethods&columns=assessmentBasis&columns=parameterGroup&columns=parameterName&columns=parameterStatus&columns=parameterAttainment&columns=parameterIrCategory&columns=parameterStateIrCategory&columns=delisted&columns=delistedReason&columns=pollutantIndicator&columns=cycleFirstListed&columns=alternateListingIdentifier&columns=vision303dPriority&columns=cwa303dPriorityRanking&columns=cycleScheduledForTmdl&columns=cycleExpectedToAttain&columns=consentDecreeCycle&columns=cycleId&columns=seasonStartDate&columns=seasonEndDate&columns=associatedActionId&columns=associatedActionName&columns=associatedActionType&columns=associatedActionStatus&columns=associatedActionAgency&columns=locationDescription&columns=sizeSource&columns=sourceScale&columns=waterSize&columns=waterSizeUnits';
  const columnsValueCurl =
    '"columns":["objectId","region","state","organizationType","organizationId","organizationName","waterType","reportingCycle","cycleLastAssessed","assessmentUnitId","assessmentUnitName","assessmentUnitStatus","overallStatus","epaIrCategory","stateIrCategory","useGroup","useName","useClassName","useSupport","useIrCategory","useStateIrCategory","monitoringStartDate","monitoringEndDate","assessmentDate","assessmentTypes","assessmentMethods","assessmentBasis","parameterGroup","parameterName","parameterStatus","parameterAttainment","parameterIrCategory","parameterStateIrCategory","delisted","delistedReason","pollutantIndicator","cycleFirstListed","alternateListingIdentifier","vision303dPriority","cwa303dPriorityRanking","cycleScheduledForTmdl","cycleExpectedToAttain","consentDecreeCycle","cycleId","seasonStartDate","seasonEndDate","associatedActionId","associatedActionName","associatedActionType","associatedActionStatus","associatedActionAgency","locationDescription","sizeSource","sourceScale","waterSize","waterSizeUnits"]';

  const location = window.location;
  const origin =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it('Verify copy box Current Query text flavor 1', () => {
    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessments?assessmentUnitStatus=A`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessments?${columnsValue}&assessmentUnitStatus=A&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitStatus":["A"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessments -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box Current Query text flavor 2', () => {
    //Alternate Listing ID
    cy.selectOption('input-alternateListingIdentifier', '806226');

    //Associated Action Agency
    cy.findByRole('checkbox', { name: 'State' }).click({ force: true });

    const queryValue =
      'alternateListingIdentifier=806226&assessmentUnitStatus=A&associatedActionAgency=State';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessments?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessments?${columnsValue}&${queryValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"alternateListingIdentifier":["806226"],"assessmentUnitStatus":["A"],"associatedActionAgency":["State"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessments -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box Current Query text flavor 3', () => {
    //Assessment Date
    cy.get('#input-assessmentDateLo').type('1999-12-31');
    cy.get('#input-assessmentDateHi').type('2023-01-16');

    //Associated Action ID
    cy.selectOption('input-associatedActionId', 'indian fork');

    //Associated Action Status
    cy.selectOption('input-associatedActionStatus', 'Draft');

    //CWA 303d Priority Ranking
    cy.findByRole('checkbox', { name: 'Low' }).click({ force: true });

    const queryValue =
      'assessmentDateLo=12-31-1999&assessmentDateHi=01-16-2023&assessmentUnitStatus=A&associatedActionId=51180&associatedActionStatus=Draft&cwa303dPriorityRanking=Low';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessments?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessments?${columnsValue}&${queryValue}&format=csv&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentDateLo":"12-31-1999","assessmentDateHi":"01-16-2023","assessmentUnitStatus":["A"],"associatedActionId":["51180"],"associatedActionStatus":["Draft"],"cwa303dPriorityRanking":["Low"]},"options":{"format":"csv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessments -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box Current Query text flavor 4', () => {
    //Cycle Expected to Attain
    cy.get('#input-cycleExpectedToAttainLo').type('2008');
    cy.get('#input-cycleExpectedToAttainHi').type('2022');

    //State
    cy.selectOption('input-state', 'indiana');

    //State IR Category
    cy.selectOption('input-stateIrCategory', '3x');

    //Use State IR Category
    cy.selectOption('input-useStateIrCategory', '4A');

    //File Format
    cy.findByText('Microsoft Excel (XLSX)').click();

    const queryValue =
      'assessmentUnitStatus=A&cycleExpectedToAttainLo=2008&cycleExpectedToAttainHi=2022&state=IN&stateIrCategory=3x&useStateIrCategory=4A';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessments?${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/api/attains/assessments?${columnsValue}&${queryValue}&format=xlsx&api_key=<YOUR_API_KEY>`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"assessmentUnitStatus":["A"],"cycleExpectedToAttainLo":"2008","cycleExpectedToAttainHi":"2022","state":["IN"],"stateIrCategory":["3x"],"useStateIrCategory":["4A"]},"options":{"format":"xlsx"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessments -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });

  it('Verify copy box Current Query text flavor 5', () => {
    //Alternate Listing ID
    cy.selectOption('input-alternateListingIdentifier', '72992');

    //Assessment Basis
    cy.selectOption('input-assessmentBasis', 'monitored data');

    //Assessment Date
    cy.get('#input-assessmentDateLo').type('2006-12-26');
    cy.get('#input-assessmentDateHi').type('2021-03-09');

    //Assessment Methods
    cy.selectOption('input-assessmentMethods', 'fish surveys');

    //Assessment Type
    cy.selectOption('input-assessmentTypes', 'biological');

    //Assessment Unit ID
    cy.selectOption('input-assessmentUnitId', 'VAN-A01R_PIA01A00');
    cy.selectOption('input-assessmentUnitId', 'camp');

    //Assessment Unit
    cy.findAllByRole('checkbox', { name: 'Historical' }).each(
      ($elem, index) => {
        index === 0 ? cy.wrap($elem).click({ force: true }) : '';
      },
    );

    //Associated Action Agency
    cy.findByRole('checkbox', { name: 'EPA' }).click({ force: true });

    //Associated Action ID
    cy.selectOption('input-associatedActionId', '1024');
    cy.selectOption('input-associatedActionId', 'chartiers creek');

    //Associated Action Status
    cy.selectOption('input-associatedActionStatus', 'Draft');

    //Associated Action Type
    cy.selectOption('input-associatedActionType', 'Implementation Completed');

    //CWA 303d Priority Ranking
    cy.findByRole('checkbox', { name: 'Medium' }).click({ force: true });

    //Cycle Expected to Attain
    cy.get('#input-cycleExpectedToAttainLo').type('2010');
    cy.get('#input-cycleExpectedToAttainHi').type('2013');

    //Cycle First
    cy.get('#input-cycleFirstListedLo').type('2008');
    cy.get('#input-cycleFirstListedHi').type('2023');

    //Cycle Last Assessed
    cy.get('#input-cycleLastAssessedLo').type('2007');
    cy.get('#input-cycleLastAssessedHi').type('2021');

    //Cycle Scheduled for TMDL
    cy.get('#input-cycleScheduledForTmdlLo').type('2005');
    cy.get('#input-cycleScheduledForTmdlHi').type('2019');

    //Delisted
    cy.findAllByRole('checkbox', { name: 'Yes' }).each(($elem, index) => {
      index === 0 ? cy.wrap($elem).click({ force: true }) : '';
    });

    //Delisted Reason
    cy.selectOption('input-delistedReason', 'not specified');

    //EPA IR Category
    cy.selectOption('input-epaIrCategory', '4a');

    //Monitoring End Date
    cy.get('#input-monitoringEndDateLo').type('2014-06-03');
    cy.get('#input-monitoringEndDateHi').type('2019-07-16');

    //Monitoring Start Date
    cy.get('#input-monitoringStartDateLo').type('2013-08-08');
    cy.get('#input-monitoringStartDateHi').type('2021-06-23');

    //Overall Status
    cy.selectOption('input-overallStatus', 'not a');

    //Parameter Name
    cy.selectOption('input-parameterName', 'radium');

    //Parameter Attainment
    cy.selectOption('input-parameterAttainment', 'algae');

    //Parameter Group
    cy.selectOption('input-parameterGroup', 'other');

    //Parameter IR Category
    cy.selectOption('input-parameterIrCategory', '2');

    // //Parameter State IR Category
    cy.selectOption('input-parameterStateIrCategory', '4B');

    //Parameter Status
    cy.findByRole('checkbox', { name: 'Meeting Criteria' }).click({
      force: true,
    });

    //Pollutant Indicator
    cy.findAllByRole('checkbox', { name: 'No' }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : '';
    });

    //Use Group
    cy.selectOption('input-useGroup', 'AGRICULTURAL');

    //Organization ID
    cy.selectOption('input-organizationId', '21pa');
    cy.selectOption('input-organizationId', 'iowa');

    //State
    cy.selectOption('input-state', 'arizona');

    //Region
    cy.selectOption('input-region', '08');

    //Reporting Cycle
    cy.selectOption('input-reportingCycle', 'latest');

    //Season End Date
    cy.get('#input-seasonEndDateLo').type('2014-04-23');
    cy.get('#input-seasonEndDateHi').type('2022-03-07');

    //Season Start Date
    cy.get('#input-seasonStartDateLo').type('2009-12-08');
    cy.get('#input-seasonStartDateHi').type('2022-06-03');

    //State IR Category
    cy.selectOption('input-stateIrCategory', '3x');

    //Use Class Name
    cy.selectOption('input-useClassName', 'vii');

    //Use Name
    cy.selectOption('input-useName', 'scenic value');

    //Use State IR Category
    cy.selectOption('input-useStateIrCategory', '1');

    //Use Support
    cy.findAllByRole('checkbox', { name: 'No' }).each(($elem, index) => {
      index === 2 ? cy.wrap($elem).click({ force: true }) : '';
    });

    //Vision 303d Priority
    cy.findAllByRole('checkbox', { name: 'Yes' }).each(($elem, index) => {
      index === 3 ? cy.wrap($elem).click({ force: true }) : '';
    });

    //Water Type
    cy.selectOption('input-waterType', 'wash');

    //File Format
    cy.findByText('Tab-separated (TSV)').click();

    const queryValue =
      'alternateListingIdentifier=72992&assessmentBasis=Monitored%20Data&assessmentDateLo=12-26-2006&assessmentDateHi=03-09-2021&assessmentMethods=Fish%20surveys&assessmentTypes=BIOLOGICAL&assessmentUnitId=VAN-A01R_PIA01A00&assessmentUnitId=AK-20401-004_00&assessmentUnitStatus=A&assessmentUnitStatus=H&associatedActionAgency=EPA&associatedActionId=1024&associatedActionId=257&associatedActionStatus=Draft&associatedActionType=Implementation%20Completed&cwa303dPriorityRanking=Medium&cycleExpectedToAttainLo=2010&cycleExpectedToAttainHi=2013&cycleFirstListedLo=2008&cycleFirstListedHi=2023&cycleLastAssessedLo=2007&cycleLastAssessedHi=2021&cycleScheduledForTmdlLo=2005&cycleScheduledForTmdlHi=2019&delisted=Y&delistedReason=Not%20specified&epaIrCategory=4A&monitoringEndDateLo=06-03-2014&monitoringEndDateHi=07-16-2019&monitoringStartDateLo=08-08-2013&monitoringStartDateHi=06-23-2021&organizationId=21PA&organizationId=21IOWA&overallStatus=Not%20Assessed&parameterAttainment=ALGAE&parameterGroup=METALS%20(OTHER%20THAN%20MERCURY)&parameterIrCategory=2&parameterName=RADIUM&parameterStateIrCategory=4B&parameterStatus=Meeting%20Criteria&pollutantIndicator=N&region=08&seasonEndDateLo=04-23-2014&seasonEndDateHi=03-07-2022&seasonStartDateLo=12-08-2009&seasonStartDateHi=06-03-2022&state=AZ&stateIrCategory=3x&useClassName=VII&useGroup=AGRICULTURAL&useName=Scenic%20Value&useStateIrCategory=1&vision303dPriority=N&waterType=WASH';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessments?${queryValue}`,
    );

    cy.findByText(
      'The GET request for this query exceeds the maximum URL character length. Please use a POST request instead (see the cURL query below).',
    );

    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        `{"filters":{"alternateListingIdentifier":["72992"],"assessmentBasis":["Monitored Data"],"assessmentDateLo":"12-26-2006","assessmentDateHi":"03-09-2021","assessmentMethods":["Fish surveys"],"assessmentTypes":["BIOLOGICAL"],"assessmentUnitId":["VAN-A01R_PIA01A00","AK-20401-004_00"],"assessmentUnitStatus":["A","H"],"associatedActionAgency":["EPA"],"associatedActionId":["1024","257"],"associatedActionStatus":["Draft"],"associatedActionType":["Implementation Completed"],"cwa303dPriorityRanking":["Medium"],"cycleExpectedToAttainLo":"2010","cycleExpectedToAttainHi":"2013","cycleFirstListedLo":"2008","cycleFirstListedHi":"2023","cycleLastAssessedLo":"2007","cycleLastAssessedHi":"2021","cycleScheduledForTmdlLo":"2005","cycleScheduledForTmdlHi":"2019","delisted":["Y"],"delistedReason":["Not specified"],"epaIrCategory":["4A"],"monitoringEndDateLo":"06-03-2014","monitoringEndDateHi":"07-16-2019","monitoringStartDateLo":"08-08-2013","monitoringStartDateHi":"06-23-2021","organizationId":["21PA","21IOWA"],"overallStatus":["Not Assessed"],"parameterAttainment":["ALGAE"],"parameterGroup":["METALS (OTHER THAN MERCURY)"],"parameterIrCategory":["2"],"parameterName":["RADIUM"],"parameterStateIrCategory":["4B"],"parameterStatus":["Meeting Criteria"],"pollutantIndicator":["N"],"region":["08"],"seasonEndDateLo":"04-23-2014","seasonEndDateHi":"03-07-2022","seasonStartDateLo":"12-08-2009","seasonStartDateHi":"06-03-2022","state":["AZ"],"stateIrCategory":["3x"],"useClassName":["VII"],"useGroup":["AGRICULTURAL"],"useName":["Scenic Value"],"useStateIrCategory":["1"],"vision303dPriority":["N"],"waterType":["WASH"]},"options":{"format":"tsv"},${columnsValueCurl}}`,
      )} ${origin}/api/attains/assessments -H "X-Api-Key: <YOUR_API_KEY>"`,
    );
  });
});
