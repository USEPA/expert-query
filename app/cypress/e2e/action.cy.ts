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

  it("Verify copy box Current Query text flavor 1", () => {
    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=actions&format=csv`
        );
      });
  });

  it("Verify copy box Current Query text flavor 2", () => {
    cy.findByRole("checkbox", { name: "State" }).click({ force: true });

    cy.selectOption("input-actionId", "10081");
    cy.selectOption("input-actionId", "56325");

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=actions&format=csv&actionAgency=S&actionId=10081&actionId=56325`
        );
      });
  });

  it("Verify copy box Current Query text flavor 3", () => {
    cy.findByRole("checkbox", { name: "EPA" }).click({ force: true });

    cy.selectOption("input-region", "06");
    cy.selectOption("input-region", "09");

    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=actions&format=tsv&actionAgency=E&region=06&region=09`
        );
      });
  });

  it("Verify copy box Current Query text flavor 4", () => {
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });

    cy.selectOption("input-assessmentUnitId", "as-10s");
    cy.selectOption("input-assessmentUnitId", "as-05s");

    cy.selectOption("input-waterType", "wash");
    cy.selectOption("input-waterType", "harbor");

    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=actions&format=xlsx&actionAgency=T&assessmentUnitId=AS-10S&assessmentUnitId=AS-05S&waterType=WASH&waterType=HARBOR`
        );
      });
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

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "aasu-streams");
    cy.selectOption("input-assessmentUnitName", "acre swamp");

    //Organization ID
    cy.selectOption("input-organizationId", "21mswq");

    //Water Type
    cy.selectOption("input-waterType", "gulf");

    // File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=actions&format=xlsx&actionAgency=T&actionAgency=E&actionId=10081&actionId=10817&actionName=ALDER CREEK- RUBY RIVER WATERSHED TMDL  &actionName= NELSON CREEK (HEADWATERS TO THE MOUTH - BIG DRY CREEK ARM OF FORT PECK RES) - REDWATER RIVER TPA&assessmentUnitId=AS-03O&assessmentUnitId=AS-04S&assessmentUnitName=Aasu-Streams&assessmentUnitName=Acre Swamp&organizationId=21MSWQ&waterType=GULF`
        );
      });
  });

  it("Verify copy box Action API Query text flavor 1", () => {
    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/actions?format=csv`
        );
      });
  });

  it("Verify copy box Action API Query text flavor 2", () => {
    cy.findByRole("checkbox", { name: "State" }).click({ force: true });

    cy.selectOption("input-actionId", "10715");
    cy.selectOption("input-actionId", "1880");

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/actions?format=csv&actionAgency=S&actionId=10715&actionId=1880`
        );
      });
  });

  it("Verify copy box Action API Query text flavor 3", () => {
    cy.findByRole("checkbox", { name: "EPA" }).click({ force: true });

    cy.selectOption("input-region", "08");
    cy.selectOption("input-region", "09");

    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/actions?format=tsv&actionAgency=E&region=08&region=09`
        );
      });
  });

  it("Verify copy box Action API Query text flavor 4", () => {
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });

    cy.selectOption("input-assessmentUnitId", "as-11o");
    cy.selectOption("input-assessmentUnitId", "mt40b002_020");

    cy.selectOption("input-waterType", "inlet");
    cy.selectOption("input-waterType", "bay");

    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/actions?format=xlsx&actionAgency=T&assessmentUnitId=AS-11O&assessmentUnitId=MT40B002_020&waterType=INLET&waterType=BAY`
        );
      });
  });

  it("Verify copy box Action API Query text flavor 5", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });
    cy.findByRole("checkbox", { name: "EPA" }).click({ force: true });

    //Action ID
    cy.selectOption("input-actionId", "2144");
    cy.selectOption("input-actionId", "33999");

    //Action Name
    cy.selectOption("input-actionName", "arrastra");
    cy.selectOption("input-actionName", "king creek");

    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "as-03O");
    cy.selectOption("input-assessmentUnitId", "as-04s");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "abel bay");
    cy.selectOption("input-assessmentUnitName", "afao-asili-ocean");

    //Organization ID
    cy.selectOption("input-organizationId", "ct_depo1");

    //Water Type
    cy.selectOption("input-waterType", "impoundment");

    // File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/actions?format=xlsx&actionAgency=T&actionAgency=E&actionId=2144&actionId=33999&actionName=ARRASTRA CREEK - BLACKFOOT HEADWATERS PLANNING AREA&actionName=KING CREEK (HEADWATERS TO FORT BELKNAP RESERVATION BOUNDARY) - LANDUSKY TPA METALS&assessmentUnitId=AS-03O&assessmentUnitId=AS-04S&assessmentUnitName=Abel Bay&assessmentUnitName=Afao-Asili-Ocean&waterType=IMPOUNDMENT`
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
          )} ${origin}/attains/data/actions`
        );
      });
  });

  it("Verify copy box cURL command text flavor 2", () => {
    cy.findByRole("checkbox", { name: "EPA" }).click({ force: true });

    cy.selectOption("input-actionId", "10816");
    cy.selectOption("input-actionId", "10715");

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"actionAgency":["E"],"actionId":["10816","10715"]},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/actions`
        );
      });
  });

  it("Verify copy box cURL command text flavor 3", () => {
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });

    cy.selectOption("input-state", "texas");
    cy.selectOption("input-state", "oklahoma");

    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"actionAgency":["T"],"state":["TX","OK"]},"options":{"format":"tsv"}}'
          )} ${origin}/attains/data/actions`
        );
      });
  });

  it("Verify copy box cURL command text flavor 4", () => {
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });

    cy.selectOption("input-organizationName", "california");
    cy.selectOption("input-organizationName", "louisiana");

    cy.selectOption("input-parameter", "cfc-113");
    cy.selectOption("input-parameter", "quinoxyfen");

    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"actionAgency":["T"],"organizationName":["California","Louisiana"],"parameter":["CFC-113","QUINOXYFEN"]},"options":{"format":"xlsx"}}'
          )} ${origin}/attains/data/actions`
        );
      });
  });

  it("Verify copy box cURL command text flavor 5", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });
    cy.findByRole("checkbox", { name: "State" }).click({ force: true });

    //Parameter
    cy.selectOption("input-parameter", "cfc-113");
    cy.selectOption("input-parameter", "quinoxyfen");

    //Action Name
    cy.selectOption("input-actionName", "arrastra");
    cy.selectOption("input-actionName", "king creek");

    //Organization Name
    cy.selectOption("input-organizationName", "california");
    cy.selectOption("input-organizationName", "louisiana");

    //State
    cy.selectOption("input-state", "alaska");
    cy.selectOption("input-state", "massachusetts");

    //Organization ID
    cy.selectOption("input-organizationId", "21hi");

    //Water Type
    cy.selectOption("input-waterType", "sink hole");

    // File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"actionAgency":["T","S"],"actionName":["ARRASTRA CREEK - BLACKFOOT HEADWATERS PLANNING AREA","KING CREEK (HEADWATERS TO FORT BELKNAP RESERVATION BOUNDARY) - LANDUSKY TPA METALS"],"organizationId":["21HI"],"organizationName":["California","Louisiana"],"parameter":["CFC-113","QUINOXYFEN"],"state":["AK","MA"],"waterType":["SINK HOLE"]},"options":{"format":"xlsx"}}'
          )} ${origin}/attains/data/actions`
        );
      });
  });
});
