describe("Data Profile Assessments", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.selectProfile("Assessments");
    cy.findByRole("button", { name: "Queries" }).click();
  });

  const location = window.location;
  const origin =
    location.hostname === "localhost"
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it("Verify copy box Current Query text flavor 1", () => {
    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/assessments/#format=csv`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/assessments?format=csv`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{},"options":{"format":"csv"}}'
      )} ${origin}/attains/data/assessments`
    );
  });

  it("Verify copy box Current Query text flavor 2", () => {
    //Alternate Listing ID
    cy.selectOption("input-alternateListingIdentifier", "6226");

    //Associated Action Agency
    cy.findByRole("checkbox", { name: "State" }).click({ force: true });

    const queryValue =
      "format=csv&alternateListingIdentifier=6226&associatedActionAgency=S";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/assessments/#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/assessments?${queryValue}`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"alternateListingIdentifier":["6226"],"associatedActionAgency":["S"]},"options":{"format":"csv"}}'
      )} ${origin}/attains/data/assessments`
    );
  });

  it("Verify copy box Current Query text flavor 3", () => {
    //Assessment Date
    cy.get("#input-assessmentDateLo").type("1999-12-31");
    cy.get("#input-assessmentDateHi").type("2023-01-16");

    //Assessment Unit Name
    cy.selectOption("input-associatedActionName", "indian fork");

    //Associated Action Status
    cy.findAllByRole("checkbox", { name: "Active" }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //CWA 303d Priority Ranking
    cy.findByRole("checkbox", { name: "Low" }).click({ force: true });

    const queryValue =
      "format=csv&associatedActionName=Indian%20Fork&associatedActionStatus=A&cwa303dPriorityRanking=Low&assessmentDateLo=12-31-1999&assessmentDateHi=01-16-2023";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/assessments/#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/assessments?${queryValue}`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"associatedActionName":["Indian Fork"],"associatedActionStatus":["A"],"cwa303dPriorityRanking":["Low"],"assessmentDateLo":"12-31-1999","assessmentDateHi":"01-16-2023"},"options":{"format":"csv"}}'
      )} ${origin}/attains/data/assessments`
    );
  });

  it("Verify copy box Current Query text flavor 4", () => {
    //Cycle Expected to Attain
    cy.get("#input-cycleExpectedToAttainLo").type("2008");
    cy.get("#input-cycleExpectedToAttainHi").type("2022");

    //State
    cy.selectOption("input-state", "indiana");

    //State IR Category
    cy.selectOption("input-stateIrCategory", "3x");

    //Use IR Category
    cy.selectOption("input-useStateIrCategory", "2");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    const queryValue =
      "format=xlsx&state=IN&stateIrCategory=3x&useStateIrCategory=2&cycleExpectedToAttainLo=2008&cycleExpectedToAttainHi=2022";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/assessments/#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/assessments?${queryValue}`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"state":["IN"],"stateIrCategory":["3x"],"useStateIrCategory":["2"],"cycleExpectedToAttainLo":"2008","cycleExpectedToAttainHi":"2022"},"options":{"format":"xlsx"}}'
      )} ${origin}/attains/data/assessments`
    );
  });

  it("Verify copy box Current Query text flavor 5", () => {
    //Alternate Listing ID
    cy.selectOption("input-alternateListingIdentifier", "72992");

    //Assessment Basis
    cy.selectOption("input-assessmentBasis", "monitored data");

    //Assessment Date
    cy.get("#input-assessmentDateLo").type("2006-12-26");
    cy.get("#input-assessmentDateHi").type("2021-03-09");

    //Assessment Methods
    cy.selectOption("input-assessmentMethods", "fish surveys");

    //Assessment Type
    cy.selectOption("input-assessmentTypes", "biological");

    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "VAN-A29R_PAS01A14");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "camp");

    //Assessment Unit
    cy.findAllByRole("checkbox", { name: "Historical" }).each(
      ($elem, index) => {
        index === 0 ? cy.wrap($elem).click({ force: true }) : "";
      }
    );

    //Associated Action Agency
    cy.findByRole("checkbox", { name: "EPA" }).click({ force: true });

    //Associated Action ID
    cy.selectOption("input-associatedActionId", "1024");

    //Associated Action Name
    cy.selectOption("input-associatedActionName", "chartiers creek");

    //Associated Action Status
    cy.findAllByRole("checkbox", { name: "Active" }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Associated Action Type
    cy.selectOption("input-associatedActionType", "a public");

    //CWA 303d Priority Ranking
    cy.findByRole("checkbox", { name: "Medium" }).click({ force: true });

    //Cycle Expected to Attain
    cy.get("#input-cycleExpectedToAttainLo").type("2010");
    cy.get("#input-cycleExpectedToAttainHi").type("2013");

    //Cycle First
    cy.get("#input-cycleFirstListedLo").type("2008");
    cy.get("#input-cycleFirstListedHi").type("2023");

    //Cycle Last Assessed
    cy.get("#input-cycleLastAssessedLo").type("2007");
    cy.get("#input-cycleLastAssessedHi").type("2021");

    //Cycle Scheduled for TMDL
    cy.get("#input-cycleScheduledForTmdlLo").type("2005");
    cy.get("#input-cycleScheduledForTmdlHi").type("2019");

    //Delisted
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 0 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Delisted Reason
    cy.selectOption("input-delistedReason", "not specified");

    //EPA IR Category
    cy.selectOption("input-epaIrCategory", "4a");

    //Monitoring End Date
    cy.get("#input-monitoringEndDateLo").type("2014-06-03");
    cy.get("#input-monitoringEndDateHi").type("2019-07-16");

    //Monitoring Start Date
    cy.get("#input-monitoringStartDateLo").type("2013-08-08");
    cy.get("#input-monitoringStartDateHi").type("2021-06-23");

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Organization Name
    cy.selectOption("input-organizationName", "iowa");

    //Overall Status
    cy.selectOption("input-overallStatus", "not a");

    //Parameter Attainment
    cy.selectOption("input-parameterAttainment", "algae");

    //Parameter Group
    cy.selectOption("input-parameterGroup", "other");

    //Parameter Name
    cy.selectOption("input-parameterName", "radium");

    // //Parameter State IR Category
    // cy.selectOption("input-parameterStateIrCategory", "cfc-113");

    //Parameter Status
    cy.findByRole("checkbox", { name: "Meeting Criteria" }).click({
      force: true,
    });

    //Pollutant Indicator
    cy.findAllByRole("checkbox", { name: "No" }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Region
    cy.selectOption("input-region", "08");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("2005");
    cy.get("#input-reportingCycleHi").type("2022");

    //Season End Date
    cy.get("#input-seasonEndDateLo").type("2014-04-23");
    cy.get("#input-seasonEndDateHi").type("2022-03-07");

    //Season Start Date
    cy.get("#input-seasonStartDateLo").type("2009-12-08");
    cy.get("#input-seasonStartDateHi").type("2022-06-03");

    //State
    cy.selectOption("input-state", "arizona");

    //State IR Category
    cy.selectOption("input-stateIrCategory", "3x");

    //Use Class Name
    cy.selectOption("input-useClassName", "vii");

    //Use Group
    cy.selectOption("input-useGroup", "AGRICULTURAL");

    //Use Name
    cy.selectOption("input-useName", "scenic value");

    //Use State IR Category
    cy.selectOption("input-useStateIrCategory", "1");

    //Use Support
    cy.findAllByRole("checkbox", { name: "No" }).each(($elem, index) => {
      index === 2 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Vision 303d Priority
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 3 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Water Type
    cy.selectOption("input-waterType", "wash");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    const queryValue =
      "format=tsv&alternateListingIdentifier=72992&assessmentBasis=Monitored%20Data&assessmentMethods=Fish%20surveys&assessmentTypes=BIOLOGICAL&assessmentUnitId=VAN-A29R_PAS01A14&assessmentUnitName=Camp&assessmentUnitStatus=H&associatedActionAgency=E&associatedActionId=1024&associatedActionName=Chartiers%20Creek&associatedActionStatus=A&associatedActionType=Public%20Meeting%20Held&cwa303dPriorityRanking=Medium&delisted=Y&delistedReason=NOT_SPECIFIED&epaIrCategory=4A&organizationId=21PA&organizationName=Iowa&overallStatus=Not%20Assessed&parameterAttainment=ALGAE&parameterGroup=METALS%20(OTHER%20THAN%20MERCURY)&parameterName=RADIUM&parameterStatus=Meeting%20Criteria&pollutantIndicator=N&region=08&state=AZ&stateIrCategory=3x&useClassName=VII&useGroup=AGRICULTURAL&useName=Scenic%20Value&useStateIrCategory=1&useSupport=N&vision303dPriority=Y&waterType=WASH&assessmentDateLo=12-26-2006&assessmentDateHi=03-09-2021&monitoringEndDateLo=06-03-2014&monitoringEndDateHi=07-16-2019&monitoringStartDateLo=08-08-2013&monitoringStartDateHi=06-23-2021&seasonEndDateLo=04-23-2014&seasonEndDateHi=03-07-2022&seasonStartDateLo=12-08-2009&seasonStartDateHi=06-03-2022&cycleExpectedToAttainLo=2010&cycleExpectedToAttainHi=2013&cycleFirstListedLo=2008&cycleFirstListedHi=2023&cycleLastAssessedLo=2007&cycleLastAssessedHi=2021&cycleScheduledForTmdlLo=2005&cycleScheduledForTmdlHi=2019&reportingCycleLo=2005&reportingCycleHi=2022";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/assessments/#${queryValue}`
    );

    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/assessments?${queryValue}`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"alternateListingIdentifier":["72992"],"assessmentBasis":["Monitored Data"],"assessmentMethods":["Fish surveys"],"assessmentTypes":["BIOLOGICAL"],"assessmentUnitId":["VAN-A29R_PAS01A14"],"assessmentUnitName":["Camp"],"assessmentUnitStatus":["H"],"associatedActionAgency":["E"],"associatedActionId":["1024"],"associatedActionName":["Chartiers Creek"],"associatedActionStatus":["A"],"associatedActionType":["Public Meeting Held"],"cwa303dPriorityRanking":["Medium"],"delisted":["Y"],"delistedReason":["NOT_SPECIFIED"],"epaIrCategory":["4A"],"organizationId":["21PA"],"organizationName":["Iowa"],"overallStatus":["Not Assessed"],"parameterAttainment":["ALGAE"],"parameterGroup":["METALS (OTHER THAN MERCURY)"],"parameterName":["RADIUM"],"parameterStatus":["Meeting Criteria"],"pollutantIndicator":["N"],"region":["08"],"state":["AZ"],"stateIrCategory":["3x"],"useClassName":["VII"],"useGroup":["AGRICULTURAL"],"useName":["Scenic Value"],"useStateIrCategory":["1"],"useSupport":["N"],"vision303dPriority":["Y"],"waterType":["WASH"],"assessmentDateLo":"12-26-2006","assessmentDateHi":"03-09-2021","monitoringEndDateLo":"06-03-2014","monitoringEndDateHi":"07-16-2019","monitoringStartDateLo":"08-08-2013","monitoringStartDateHi":"06-23-2021","seasonEndDateLo":"04-23-2014","seasonEndDateHi":"03-07-2022","seasonStartDateLo":"12-08-2009","seasonStartDateHi":"06-03-2022","cycleExpectedToAttainLo":"2010","cycleExpectedToAttainHi":"2013","cycleFirstListedLo":"2008","cycleFirstListedHi":"2023","cycleLastAssessedLo":"2007","cycleLastAssessedHi":"2021","cycleScheduledForTmdlLo":"2005","cycleScheduledForTmdlHi":"2019","reportingCycleLo":"2005","reportingCycleHi":"2022"},"options":{"format":"tsv"}}'
      )} ${origin}/attains/data/assessments`
    );
  });
});
