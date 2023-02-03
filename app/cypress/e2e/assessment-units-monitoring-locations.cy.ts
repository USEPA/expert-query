describe("Data Profile Assessment Units with Monitoring Locations", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.selectProfile("Assessment Units with Monitoring Locations");
    cy.findByRole("button", { name: "Queries" }).click();
  });

  const location = window.location;
  const origin =
    location.hostname === "localhost"
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it("Verify copy box text flavor 1", () => {
    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/assessmentUnitsMonitoringLocations#`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/assessmentUnitsMonitoringLocations?format=csv`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{},"options":{"format":"csv"}}'
      )} ${origin}/attains/data/assessmentUnitsMonitoringLocations`
    );
  });

  it("Verify copy box text flavor 2", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "dn_am_watershed-2");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "american creek");

    const queryValue =
      "assessmentUnitId=DN_AM_Watershed-2&assessmentUnitName=American%20Creek";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/assessmentUnitsMonitoringLocations#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/assessmentUnitsMonitoringLocations?${queryValue}&format=csv`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentUnitId":["DN_AM_Watershed-2"],"assessmentUnitName":["American Creek"]},"options":{"format":"csv"}}'
      )} ${origin}/attains/data/assessmentUnitsMonitoringLocations`
    );
  });

  it("Verify copy box text flavor 3", () => {
    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    //Monitoring Location Organization ID
    cy.selectOption("input-monitoringLocationOrgId", "tswqc_wqx");

    //Use Class Name
    cy.selectOption("input-useClassName", "non-class");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    const queryValue =
      "assessmentUnitStatus=H&monitoringLocationOrgId=TSWQC_WQX&useClassName=NON-CLASS";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/assessmentUnitsMonitoringLocations#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/assessmentUnitsMonitoringLocations?${queryValue}&format=xlsx`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentUnitStatus":["H"],"monitoringLocationOrgId":["TSWQC_WQX"],"useClassName":["NON-CLASS"]},"options":{"format":"xlsx"}}'
      )} ${origin}/attains/data/assessmentUnitsMonitoringLocations`
    );
  });

  it("Verify copy box text flavor 4", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "delawarenation-1300");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Reporting Cycle
    cy.selectOption("input-reportingCycle", "latest");

    //Water Type
    cy.selectOption("input-waterType", "harbor");

    //File Format
    cy.findByText("JavaScript Object Notation (JSON)").click();

    const queryValue =
      "assessmentUnitId=DELAWARENATION-1300&assessmentUnitStatus=H&organizationId=21PA&waterType=GREAT%20LAKES%20BAYS%20AND%20HARBORS";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/assessmentUnitsMonitoringLocations#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/assessmentUnitsMonitoringLocations?${queryValue}&format=json`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentUnitId":["DELAWARENATION-1300"],"assessmentUnitStatus":["H"],"organizationId":["21PA"],"waterType":["GREAT LAKES BAYS AND HARBORS"]},"options":{"format":"json"}}'
      )} ${origin}/attains/data/assessmentUnitsMonitoringLocations`
    );
  });

  it("Verify copy box text flavor 5", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "dn_am_watershed");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "ashley lake");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });

    //Monitoring Location ID
    cy.selectOption("input-monitoringLocationId", "a10");

    //Monitoring Location Organization ID
    cy.selectOption("input-monitoringLocationOrgId", "21awic");

    //Organization ID
    cy.selectOption("input-organizationId", "redlake");

    //Organization Name
    cy.selectOption("input-organizationName", "wyoming");

    //Region
    cy.selectOption("input-region", "04");

    //Reporting Cycle
    cy.selectOption("input-reportingCycle", "latest");

    //State
    cy.selectOption("input-state", "oklahoma");

    //Use Class Name
    cy.selectOption("input-useClassName", "vii");

    //Water Type
    cy.selectOption("input-waterType", "harbor");

    //File Format
    cy.findByText("JavaScript Object Notation (JSON)").click();

    const queryValue =
      "assessmentUnitId=DN_AM_Watershed&assessmentUnitName=Ashley%20Lake&assessmentUnitStatus=A&monitoringLocationId=A10&monitoringLocationOrgId=21AWIC&organizationId=REDLAKE&organizationName=Wyoming&region=04&state=OK&useClassName=VII&waterType=GREAT%20LAKES%20BAYS%20AND%20HARBORS";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/assessmentUnitsMonitoringLocations#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/assessmentUnitsMonitoringLocations?${queryValue}&format=json`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentUnitId":["DN_AM_Watershed"],"assessmentUnitName":["Ashley Lake"],"assessmentUnitStatus":["A"],"monitoringLocationId":["A10"],"monitoringLocationOrgId":["21AWIC"],"organizationId":["REDLAKE"],"organizationName":["Wyoming"],"region":["04"],"state":["OK"],"useClassName":["VII"],"waterType":["GREAT LAKES BAYS AND HARBORS"]},"options":{"format":"json"}}'
      )} ${origin}/attains/data/assessmentUnitsMonitoringLocations`
    );
  });
});
