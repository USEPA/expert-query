describe("Data Profile Action", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.selectProfile("Actions");
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
      `${origin}/attains/actions/#format=csv`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/actions?format=csv`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{},"options":{"format":"csv"}}'
      )} ${origin}/attains/data/actions`
    );
  });

  it("Verify copy box text flavor 2", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "State" }).click({ force: true });

    //Action ID
    cy.selectOption("input-actionId", "10081");
    cy.selectOption("input-actionId", "56325");

    const queryValue =
      "format=csv&actionAgency=S&actionId=10081&actionId=56325";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/actions/#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/actions?${queryValue}`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"actionAgency":["S"],"actionId":["10081","56325"]},"options":{"format":"csv"}}'
      )} ${origin}/attains/data/actions`
    );
  });

  it("Verify copy box text flavor 3", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "EPA" }).click({ force: true });

    //Region
    cy.selectOption("input-region", "06");
    cy.selectOption("input-region", "09");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    const queryValue = "format=tsv&actionAgency=E&region=06&region=09";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/actions/#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/actions?${queryValue}`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"actionAgency":["E"],"region":["06","09"]},"options":{"format":"tsv"}}'
      )} ${origin}/attains/data/actions`
    );
  });

  it("Verify copy box text flavor 4", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });

    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-10s");
    cy.selectOption("input-assessmentUnitId", "as-05s");

    //Water Type
    cy.selectOption("input-waterType", "wash");
    cy.selectOption("input-waterType", "harbor");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    const queryValue =
      "format=xlsx&actionAgency=T&assessmentUnitId=AS-10S&assessmentUnitId=AS-05S&waterType=WASH&waterType=GREAT%20LAKES%20BAYS%20AND%20HARBORS";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/actions/#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/actions?${queryValue}`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"actionAgency":["T"],"assessmentUnitId":["AS-10S","AS-05S"],"waterType":["WASH","GREAT LAKES BAYS AND HARBORS"]},"options":{"format":"xlsx"}}'
      )} ${origin}/attains/data/actions`
    );
  });

  it("Verify copy box Current Query text flavor 5", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });
    cy.findByRole("checkbox", { name: "EPA" }).click({ force: true });

    //Action ID
    cy.selectOption("input-actionId", "10081");
    cy.selectOption("input-actionId", "10817");

    //Action Name
    cy.selectOption("input-actionName", "alder creek");
    cy.selectOption("input-actionName", "nelson creek");

    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-03O");
    cy.selectOption("input-assessmentUnitId", "as-04s");

    //Organization Name
    cy.selectOption("input-organizationName", "california");
    cy.selectOption("input-organizationName", "montana");

    //Organization ID
    cy.selectOption("input-organizationId", "21mswq");

    //Water Type
    cy.selectOption("input-waterType", "gulf");

    // File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    const queryValue =
      "format=xlsx&actionAgency=T&actionAgency=E&actionId=10081&actionId=10817&actionName=ALDER%20CREEK-%20RUBY%20RIVER%20WATERSHED%20TMDL%20%20&actionName=%20NELSON%20CREEK%20(HEADWATERS%20TO%20THE%20MOUTH%20-%20BIG%20DRY%20CREEK%20ARM%20OF%20FORT%20PECK%20RES)%20-%20REDWATER%20RIVER%20TPA&assessmentUnitId=AS-03O&assessmentUnitId=AS-04S&organizationId=21MSWQ&organizationName=California&organizationName=Montana&waterType=GULF";

    cy.selectCopyBox(
      "current-query-copy-box-container",
      `${origin}/attains/actions/#${queryValue}`
    );
    cy.selectCopyBox(
      "api-query-copy-box-container",
      `${origin}/attains/data/actions?${queryValue}`
    );
    cy.selectCopyBox(
      "curl-copy-box-container",
      `curl -X POST --json ${JSON.stringify(
        '{"filters":{"actionAgency":["T","E"],"actionId":["10081","10817"],"actionName":["ALDER CREEK- RUBY RIVER WATERSHED TMDL  "," NELSON CREEK (HEADWATERS TO THE MOUTH - BIG DRY CREEK ARM OF FORT PECK RES) - REDWATER RIVER TPA"],"assessmentUnitId":["AS-03O","AS-04S"],"organizationId":["21MSWQ"],"organizationName":["California","Montana"],"waterType":["GULF"]},"options":{"format":"xlsx"}}'
      )} ${origin}/attains/data/actions`
    );
  });
});
