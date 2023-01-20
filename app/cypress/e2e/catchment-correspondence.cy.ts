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

  it("Verify copy box Current Query text flavor 1", () => {
    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/catchmentCorrespondence/#format=csv`
        );
      });
  });

  it("Verify copy box Current Query text flavor 2", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-04o");

    //Organization ID
    cy.selectOption("input-organizationId", "21hi");

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/catchmentCorrespondence/#format=csv&assessmentUnitId=AS-04O&organizationId=21HI`
        );
      });
  });

  it("Verify copy box Current Query text flavor 3", () => {
    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "abbott lakes");

    //Organization Name
    cy.selectOption("input-organizationName", "california");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/catchmentCorrespondence/#format=tsv&assessmentUnitName=ABBOTT LAKES&organizationName=California`
        );
      });
  });

  it("Verify copy box Current Query text flavor 4", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-04o");

    //Organization Name
    cy.selectOption("input-organizationName", "montana");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("1993");
    cy.get("#input-reportingCycleHi").type("2010");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/catchmentCorrespondence/#format=xlsx&assessmentUnitId=AS-04O&organizationName=Montana&reportingCycleLo=1993&reportingCycleHi=2010`
        );
      });
  });

  it("Verify copy box Current Query text flavor 5", () => {
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
    cy.get("#input-reportingCycleLo").type("2015");
    cy.get("#input-reportingCycleHi").type("2023");

    //State
    cy.selectOption("input-state", "texas");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/catchmentCorrespondence/#format=tsv&assessmentUnitId=AS-01O&assessmentUnitName=Aasu-Ocean&organizationId=21PA&organizationName=California&region=06&state=TX&reportingCycleLo=2015&reportingCycleHi=2023`
        );
      });
  });

  it("Verify copy box Catchment Correspondence API Query text flavor 1", () => {
    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/catchmentCorrespondence?format=csv`
        );
      });
  });

  it("Verify copy box Catchment Correspondence API Query text flavor 2", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-01o");

    //State
    cy.selectOption("input-state", "alabama");

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/catchmentCorrespondence?format=csv&assessmentUnitId=AS-01O&state=AL`
        );
      });
  });

  it("Verify copy box Catchment Correspondence API Query text flavor 3", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-01o");

    //Organization ID
    cy.selectOption("input-organizationId", "redlake");

    //Organization Name
    cy.selectOption("input-organizationName", "montana");

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/catchmentCorrespondence?format=csv&assessmentUnitId=AS-01O&organizationId=REDLAKE&organizationName=Montana`
        );
      });
  });

  it("Verify copy box Catchment Correspondence API Query text flavor 4", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-01o");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "aasu-ocean");

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("1993");
    cy.get("#input-reportingCycleHi").type("2010");

    //State
    cy.selectOption("input-state", "alabama");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/catchmentCorrespondence?format=xlsx&assessmentUnitId=AS-01O&assessmentUnitName=Aasu-Ocean&organizationId=21PA&state=AL&reportingCycleLo=1993&reportingCycleHi=2010`
        );
      });
  });

  it("Verify copy box Catchment Correspondence API Query text flavor 5", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-04o");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "abbott lakes");

    //Organization ID
    cy.selectOption("input-organizationId", "redlake");

    //Organization Name
    cy.selectOption("input-organizationName", "montana");

    //Region
    cy.selectOption("input-region", "09");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("1998");
    cy.get("#input-reportingCycleHi").type("2008");

    //State
    cy.selectOption("input-state", "california");

    //File Format
    cy.findByText("Comma-separated (CSV)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/catchmentCorrespondence?format=csv&assessmentUnitId=AS-04O&assessmentUnitName=ABBOTT LAKES&organizationId=REDLAKE&organizationName=Montana&region=09&state=CA&reportingCycleLo=1998&reportingCycleHi=2008`
        );
      });
  });

  it("Verify copy box cURL command text flavor 1", () => {
    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/catchmentCorrespondence`
        );
      });
  });

  it("Verify copy box cURL command text flavor 2", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-04o");

    //Organization ID
    cy.selectOption("input-organizationId", "21hi");

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitId":["AS-04O"],"organizationId":["21HI"]},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/catchmentCorrespondence`
        );
      });
  });

  it("Verify copy box cURL command text flavor 3", () => {
    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "aasu-ocean");

    //Organization Name
    cy.selectOption("input-organizationName", "montana");

    //State
    cy.selectOption("input-state", "california");

    //File Format
    cy.findByText("Comma-separated (CSV)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitName":["Aasu-Ocean"],"organizationName":["Montana"],"state":["CA"]},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/catchmentCorrespondence`
        );
      });
  });

  it("Verify copy box cURL command text flavor 4", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-01o");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "aasu-ocean");

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("1998");
    cy.get("#input-reportingCycleHi").type("2008");

    //State
    cy.selectOption("input-state", "california");

    //File Format
    cy.findByText("Comma-separated (CSV)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitId":["AS-01O"],"assessmentUnitName":["Aasu-Ocean"],"organizationId":["21PA"],"state":["CA"],"reportingCycleLo":"1998","reportingCycleHi":"2008"},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/catchmentCorrespondence`
        );
      });
  });

  it("Verify copy box cURL command text flavor 5", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-02o");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "aasu-streams");

    //Organization ID
    cy.selectOption("input-organizationId", "21hi");

    //Organization Name
    cy.selectOption("input-organizationName", "kentucky");

    //Region
    cy.selectOption("input-region", "04");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("1993");
    cy.get("#input-reportingCycleHi").type("2010");

    //State
    cy.selectOption("input-state", "alabama");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitId":["AS-02O"],"assessmentUnitName":["Aasu-Streams"],"organizationId":["21HI"],"organizationName":["Kentucky"],"region":["04"],"state":["AL"],"reportingCycleLo":"1993","reportingCycleHi":"2010"},"options":{"format":"xlsx"}}'
          )} ${origin}/attains/data/catchmentCorrespondence`
        );
      });
  });
});
