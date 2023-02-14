describe('Data Profile Assessments', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.selectProfile('Assessments');
    cy.findByRole('button', { name: 'Advanced API Queries' }).click();
  });

  const location = window.location;
  const origin =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it('Verify copy box Current Query text flavor 1', () => {
    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessments#`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/attains/data/assessments?format=csv`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{},"options":{"format":"csv"}}',
      )} ${origin}/attains/data/assessments`,
    );
  });

  it('Verify copy box Current Query text flavor 2', () => {
    //Alternate Listing ID
    cy.selectOption('input-alternateListingIdentifier', '6226');

    //Associated Action Agency
    cy.findByRole('checkbox', { name: 'State' }).click({ force: true });

    const queryValue =
      'alternateListingIdentifier=6226&associatedActionAgency=S';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessments#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/attains/data/assessments?${queryValue}&format=csv`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"alternateListingIdentifier":["6226"],"associatedActionAgency":["S"]},"options":{"format":"csv"}}',
      )} ${origin}/attains/data/assessments`,
    );
  });

  it('Verify copy box Current Query text flavor 3', () => {
    //Assessment Date
    cy.get('#input-assessmentDateLo').type('1999-12-31');
    cy.get('#input-assessmentDateHi').type('2023-01-16');

    //Associated Action Name
    cy.selectOption('input-associatedActionName', 'indian fork');

    //Associated Action Status
    cy.findAllByRole('checkbox', { name: 'Active' }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : '';
    });

    //CWA 303d Priority Ranking
    cy.findByRole('checkbox', { name: 'Low' }).click({ force: true });

    const queryValue =
      'assessmentDateLo=12-31-1999&assessmentDateHi=01-16-2023&associatedActionName=Indian%20Fork&associatedActionStatus=A&cwa303dPriorityRanking=Low';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessments#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/attains/data/assessments?${queryValue}&format=csv`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentDateLo":"12-31-1999","assessmentDateHi":"01-16-2023","associatedActionName":["Indian Fork"],"associatedActionStatus":["A"],"cwa303dPriorityRanking":["Low"]},"options":{"format":"csv"}}',
      )} ${origin}/attains/data/assessments`,
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
    cy.selectOption('input-useStateIrCategory', '1');

    //File Format
    cy.findByText('Microsoft Excel (XLSX)').click();

    const queryValue =
      'cycleExpectedToAttainLo=2008&cycleExpectedToAttainHi=2022&state=IN&stateIrCategory=3x&useStateIrCategory=1';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessments#${queryValue}`,
    );
    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/attains/data/assessments?${queryValue}&format=xlsx`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"cycleExpectedToAttainLo":"2008","cycleExpectedToAttainHi":"2022","state":["IN"],"stateIrCategory":["3x"],"useStateIrCategory":["1"]},"options":{"format":"xlsx"}}',
      )} ${origin}/attains/data/assessments`,
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
    cy.selectOption('input-assessmentUnitId', 'VAN-A29R_PAS01A14');

    //Assessment Unit Name
    cy.selectOption('input-assessmentUnitName', 'camp');

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

    //Associated Action Name
    cy.selectOption('input-associatedActionName', 'chartiers creek');

    //Associated Action Status
    cy.findAllByRole('checkbox', { name: 'Active' }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : '';
    });

    //Associated Action Type
    cy.selectOption('input-associatedActionType', '3');

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

    //Organization ID
    cy.selectOption('input-organizationId', '21pa');

    //Organization Name
    cy.selectOption('input-organizationName', 'iowa');

    //Overall Status
    cy.selectOption('input-overallStatus', 'not a');

    //Parameter Attainment
    cy.selectOption('input-parameterAttainment', 'algae');

    //Parameter Group
    cy.selectOption('input-parameterGroup', 'other');

    //Parameter IR Category
    cy.selectOption('input-parameterIrCategory', '19');

    //Parameter Name
    cy.selectOption('input-parameterName', 'radium');

    // //Parameter State IR Category
    cy.selectOption('input-parameterStateIrCategory', '1ht');

    //Parameter Status
    cy.findByRole('checkbox', { name: 'Meeting Criteria' }).click({
      force: true,
    });

    //Pollutant Indicator
    cy.findAllByRole('checkbox', { name: 'No' }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : '';
    });

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

    //State
    cy.selectOption('input-state', 'arizona');

    //State IR Category
    cy.selectOption('input-stateIrCategory', '3x');

    //Use Class Name
    cy.selectOption('input-useClassName', 'vii');

    //Use Group
    cy.selectOption('input-useGroup', 'AGRICULTURAL');

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
      'alternateListingIdentifier=72992&assessmentBasis=Monitored%20Data&assessmentDateLo=12-26-2006&assessmentDateHi=03-09-2021&assessmentMethods=Fish%20surveys&assessmentTypes=BIOLOGICAL&assessmentUnitId=VAN-A29R_PAS01A14&assessmentUnitName=Camp&assessmentUnitStatus=H&associatedActionAgency=E&associatedActionId=1024&associatedActionName=Chartiers%20Creek&associatedActionStatus=A&associatedActionType=3&cwa303dPriorityRanking=Medium&cycleExpectedToAttainLo=2010&cycleExpectedToAttainHi=2013&cycleFirstListedLo=2008&cycleFirstListedHi=2023&cycleLastAssessedLo=2007&cycleLastAssessedHi=2021&cycleScheduledForTmdlLo=2005&cycleScheduledForTmdlHi=2019&delisted=Y&delistedReason=NOT_SPECIFIED&epaIrCategory=4A&monitoringEndDateLo=06-03-2014&monitoringEndDateHi=07-16-2019&monitoringStartDateLo=08-08-2013&monitoringStartDateHi=06-23-2021&organizationId=21PA&organizationName=Iowa&overallStatus=Not%20Assessed&parameterAttainment=ALGAE&parameterGroup=METALS%20(OTHER%20THAN%20MERCURY)&parameterIrCategory=19&parameterName=RADIUM&parameterStateIrCategory=1ht&parameterStatus=Meeting%20Criteria&pollutantIndicator=N&region=08&seasonEndDateLo=04-23-2014&seasonEndDateHi=03-07-2022&seasonStartDateLo=12-08-2009&seasonStartDateHi=06-03-2022&state=AZ&stateIrCategory=3x&useClassName=VII&useGroup=AGRICULTURAL&useName=Scenic%20Value&useStateIrCategory=1&useSupport=N&vision303dPriority=Y&waterType=WASH';

    cy.selectCopyBox(
      'current-query-copy-box-container',
      `${origin}/attains/assessments#${queryValue}`,
    );

    cy.selectCopyBox(
      'api-query-copy-box-container',
      `${origin}/attains/data/assessments?${queryValue}&format=tsv`,
    );
    cy.selectCopyBox(
      'curl-copy-box-container',
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"alternateListingIdentifier":["72992"],"assessmentBasis":["Monitored Data"],"assessmentDateLo":"12-26-2006","assessmentDateHi":"03-09-2021","assessmentMethods":["Fish surveys"],"assessmentTypes":["BIOLOGICAL"],"assessmentUnitId":["VAN-A29R_PAS01A14"],"assessmentUnitName":["Camp"],"assessmentUnitStatus":["H"],"associatedActionAgency":["E"],"associatedActionId":["1024"],"associatedActionName":["Chartiers Creek"],"associatedActionStatus":["A"],"associatedActionType":[3],"cwa303dPriorityRanking":["Medium"],"cycleExpectedToAttainLo":"2010","cycleExpectedToAttainHi":"2013","cycleFirstListedLo":"2008","cycleFirstListedHi":"2023","cycleLastAssessedLo":"2007","cycleLastAssessedHi":"2021","cycleScheduledForTmdlLo":"2005","cycleScheduledForTmdlHi":"2019","delisted":["Y"],"delistedReason":["NOT_SPECIFIED"],"epaIrCategory":["4A"],"monitoringEndDateLo":"06-03-2014","monitoringEndDateHi":"07-16-2019","monitoringStartDateLo":"08-08-2013","monitoringStartDateHi":"06-23-2021","organizationId":["21PA"],"organizationName":["Iowa"],"overallStatus":["Not Assessed"],"parameterAttainment":["ALGAE"],"parameterGroup":["METALS (OTHER THAN MERCURY)"],"parameterIrCategory":["19"],"parameterName":["RADIUM"],"parameterStateIrCategory":["1ht"],"parameterStatus":["Meeting Criteria"],"pollutantIndicator":["N"],"region":["08"],"seasonEndDateLo":"04-23-2014","seasonEndDateHi":"03-07-2022","seasonStartDateLo":"12-08-2009","seasonStartDateHi":"06-03-2022","state":["AZ"],"stateIrCategory":["3x"],"useClassName":["VII"],"useGroup":["AGRICULTURAL"],"useName":["Scenic Value"],"useStateIrCategory":["1"],"useSupport":["N"],"vision303dPriority":["Y"],"waterType":["WASH"]},"options":{"format":"tsv"}}',
      )} ${origin}/attains/data/assessments`,
    );
  });
});
