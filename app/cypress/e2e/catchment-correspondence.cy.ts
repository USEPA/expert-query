describe("Data Profile Catchment Correspondence", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.selectProfile("Catchment Correspondence");
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
      `${origin}/attains/catchmentCorrespondence#`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/catchmentCorrespondence?format=csv`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{},"options":{"format":"csv"}}'
      )} ${origin}/attains/data/catchmentCorrespondence`
    );
  });

  it("Verify copy box text flavor 2", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-04o");

    //Organization ID
    cy.selectOption("input-organizationId", "21hi");

    const queryValue = "assessmentUnitId=AS-04O&organizationId=21HI";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/catchmentCorrespondence#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/catchmentCorrespondence?${queryValue}&format=csv`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentUnitId":["AS-04O"],"organizationId":["21HI"]},"options":{"format":"csv"}}'
      )} ${origin}/attains/data/catchmentCorrespondence`
    );
  });

  it("Verify copy box text flavor 3", () => {
    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "abbott lakes");

    //Organization Name
    cy.selectOption("input-organizationName", "california");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    const queryValue =
      "assessmentUnitName=ABBOTT%20LAKES&organizationName=California";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/catchmentCorrespondence#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/catchmentCorrespondence?${queryValue}&format=tsv`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentUnitName":["ABBOTT LAKES"],"organizationName":["California"]},"options":{"format":"tsv"}}'
      )} ${origin}/attains/data/catchmentCorrespondence`
    );
  });

  it("Verify copy box text flavor 4", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-04o");

    //Organization Name
    cy.selectOption("input-organizationName", "montana");

    //Reporting Cycle
    cy.selectOption("input-reportingCycle", "2016{downArrow}");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    const queryValue =
      "assessmentUnitId=AS-04O&organizationName=Montana&reportingCycle=2016";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/catchmentCorrespondence#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/catchmentCorrespondence?${queryValue}&format=xlsx`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentUnitId":["AS-04O"],"organizationName":["Montana"],"reportingCycle":"2016"},"options":{"format":"xlsx"}}'
      )} ${origin}/attains/data/catchmentCorrespondence`
    );
  });

  it("Verify copy box text flavor 5", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-01o");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "aasu-ocean");

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Organization Name
    cy.selectOption("input-organizationName", "california");

    //Region
    cy.selectOption("input-region", "06");

    //Reporting Cycle
    cy.selectOption("input-reportingCycle", "2016{downArrow}");

    //State
    cy.selectOption("input-state", "texas");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    const queryValue =
      "assessmentUnitId=AS-01O&assessmentUnitName=Aasu-Ocean&organizationId=21PA&organizationName=California&region=06&reportingCycle=2016&state=TX";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/catchmentCorrespondence#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/catchmentCorrespondence?${queryValue}&format=tsv`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"assessmentUnitId":["AS-01O"],"assessmentUnitName":["Aasu-Ocean"],"organizationId":["21PA"],"organizationName":["California"],"region":["06"],"reportingCycle":"2016","state":["TX"]},"options":{"format":"tsv"}}'
      )} ${origin}/attains/data/catchmentCorrespondence`
    );
  });
});
