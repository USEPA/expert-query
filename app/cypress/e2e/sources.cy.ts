describe("Data Profile Sources", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.selectProfile("Sources");
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
          `${origin}/attains/sources/#format=csv`
        );
      });
  });

  it("Verify copy box Current Query text flavor 2", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "SD-BA-L-FREEMAN_01");

    //Confirmed
    cy.findByRole("checkbox", { name: "No" }).click({ force: true });

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/sources/#format=csv&assessmentUnitId=SD-BA-L-FREEMAN_01&confirmed=N`
        );
      });
  });

  it("Verify copy box Current Query text flavor 3", () => {
    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "agency creek");

    //Confirmed
    cy.findByRole("checkbox", { name: "No" }).click({ force: true });

    //Organization ID
    cy.selectOption("input-organizationId", "taospblo");

    //Organization Name
    cy.selectOption("input-organizationName", "district");

    //Overall Status
    cy.selectOption("input-overallStatus", "fully");

    //Parameter Group
    cy.selectOption("input-parameterGroup", "pesticides");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("2003");
    cy.get("#input-reportingCycleHi").type("2015");

    //Source Name
    cy.selectOption("input-sourceName", "groundwater");

    //Water Type
    cy.selectOption("input-waterType", "wetlands, tidal");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/sources/#format=xlsx&assessmentUnitName=Agency Creek&confirmed=N&organizationId=TAOSPBLO&organizationName=District of Columbia&overallStatus=Fully Supporting&parameterGroup=PESTICIDES&sourceName=GROUNDWATER LOADINGS&waterType=WETLANDS, TIDAL&reportingCycleLo=2003&reportingCycleHi=2015`
        );
      });
  });

  it("Verify copy box Current Query text flavor 4", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "MT40Q001_011");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "abbie creek");

    //Confirmed
    cy.findByRole("checkbox", { name: "No" }).click({ force: true });

    //Organization Name
    cy.selectOption("input-organizationName", "wisconsin");

    //Overall Status
    cy.selectOption("input-overallStatus", "not");

    //Parameter Group
    cy.selectOption("input-parameterGroup", "nutrients");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("1994");
    cy.get("#input-reportingCycleHi").type("2016");

    //Source Name
    cy.selectOption("input-sourceName", "manure lagoons");

    //State
    cy.selectOption("input-state", "hawaii");

    //Water Type
    cy.selectOption("input-waterType", "wash");

    //File Format
    cy.findByText("JavaScript Object Notation (JSON)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/sources/#format=json&assessmentUnitId=MT40Q001_011&assessmentUnitName=Abbie Creek&confirmed=N&organizationName=Wisconsin&overallStatus=Not Supporting&parameterGroup=NUTRIENTS&sourceName=MANURE LAGOONS&state=HI&waterType=WASH&reportingCycleLo=1994&reportingCycleHi=2016`
        );
      });
  });

  it("Verify copy box Current Query text flavor 5", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "AL-Gulf-of-Mexico-2");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "American Fork");

    //Cause Name
    cy.selectOption("input-causeName", "ammonia");

    //Confirmed
    cy.findByRole("checkbox", { name: "Yes" }).click({ force: true });

    //EPA IR Category
    cy.selectOption("input-epaIrCategory", "4a");

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Organization Name
    cy.selectOption("input-organizationName", "south dakota");

    //Overall Status
    cy.selectOption("input-overallStatus", "fully");

    //Parameter Group
    cy.selectOption("input-parameterGroup", "trash");

    //Region
    cy.selectOption("input-region", "06");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("2016");
    cy.get("#input-reportingCycleHi").type("2019");

    //Source Name
    cy.selectOption("input-sourceName", "pipeline");

    //State
    cy.selectOption("input-state", "florida");

    //State IR Category
    cy.selectOption("input-stateIrCategory", "biological");

    //Water Type
    cy.selectOption("input-waterType", "inland");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/sources/#format=tsv&assessmentUnitId=AL-Gulf-of-Mexico-2&assessmentUnitName=American Fork&causeName=AMMONIA&confirmed=Y&epaIrCategory=4A&organizationId=21PA&organizationName=South Dakota&overallStatus=Fully Supporting&parameterGroup=TRASH&region=06&sourceName=PIPELINE BREAKS&state=FL&stateIrCategory=5b-t&waterType=INLAND BEACH&reportingCycleLo=2016&reportingCycleHi=2019`
        );
      });
  });

  it("Verify copy box Sources API Query text flavor 1", () => {
    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/sources?format=csv`
        );
      });
  });

  it("Verify copy box Sources API Query text flavor 2", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "AL-Gulf-of-Mexico-2");

    //Confirmed
    cy.findByRole("checkbox", { name: "No" }).click({ force: true });

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/sources?format=csv&assessmentUnitId=AL-Gulf-of-Mexico-2&confirmed=N`
        );
      });
  });

  it("Verify copy box Sources API Query text flavor 3", () => {
    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "American Fork");

    //Cause Name
    cy.selectOption("input-causeName", "ammonia");

    //Confirmed
    cy.findByRole("checkbox", { name: "Yes" }).click({ force: true });

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Parameter Group
    cy.selectOption("input-parameterGroup", "trash");

    //Source Name
    cy.selectOption("input-sourceName", "pipeline");

    //State
    cy.selectOption("input-state", "florida");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/sources?format=tsv&assessmentUnitName=American Fork&causeName=AMMONIA&confirmed=Y&organizationId=21PA&parameterGroup=TRASH&sourceName=PIPELINE BREAKS&state=FL`
        );
      });
  });

  it("Verify copy box Sources API Query text flavor 4", () => {
    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "agency creek");

    //Cause Name
    cy.selectOption("input-causeName", "aldrin");

    //Confirmed
    cy.findByRole("checkbox", { name: "No" }).click({ force: true });

    //Organization ID
    cy.selectOption("input-organizationId", "taospblo");

    //Organization Name
    cy.selectOption("input-organizationName", "district");

    //Overall Status
    cy.selectOption("input-overallStatus", "fully");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("1998");
    cy.get("#input-reportingCycleHi").type("2015");

    //Source Name
    cy.selectOption("input-sourceName", "groundwater");

    //Water Type
    cy.selectOption("input-waterType", "wetlands, tidal");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/sources?format=xlsx&assessmentUnitName=Agency Creek&causeName=ALDRIN&confirmed=N&organizationId=TAOSPBLO&organizationName=District of Columbia&overallStatus=Fully Supporting&sourceName=GROUNDWATER LOADINGS&waterType=WETLANDS, TIDAL&reportingCycleLo=1998&reportingCycleHi=2015`
        );
      });
  });

  it("Verify copy box Sources API Query text flavor 5", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "MT40Q001_011");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "abbie creek");

    //Cause Name
    cy.selectOption("input-causeName", "algae");

    //Confirmed
    cy.findByRole("checkbox", { name: "No" }).click({ force: true });

    //EPA IR Category
    cy.selectOption("input-epaIrCategory", "4c");

    //Organization ID
    cy.selectOption("input-organizationId", "21hi");

    //Organization Name
    cy.selectOption("input-organizationName", "wisconsin");

    //Overall Status
    cy.selectOption("input-overallStatus", "not");

    //Parameter Group
    cy.selectOption("input-parameterGroup", "nutrients");

    //Region
    cy.selectOption("input-region", "05");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("1994");
    cy.get("#input-reportingCycleHi").type("2016");

    //Source Name
    cy.selectOption("input-sourceName", "manure lagoons");

    //State
    cy.selectOption("input-state", "hawaii");

    //State IR Category
    cy.selectOption("input-stateIrCategory", "there is a");

    //Water Type
    cy.selectOption("input-waterType", "wash");

    //File Format
    cy.findByText("JavaScript Object Notation (JSON)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/sources?format=json&assessmentUnitId=MT40Q001_011&assessmentUnitName=Abbie Creek&causeName=ALGAE&confirmed=N&epaIrCategory=4C&organizationId=21HI&organizationName=Wisconsin&overallStatus=Not Supporting&parameterGroup=NUTRIENTS&region=05&sourceName=MANURE LAGOONS&state=HI&stateIrCategory=4B-T&waterType=WASH&reportingCycleLo=1994&reportingCycleHi=2016`
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
          )} ${origin}/attains/data/sources`
        );
      });
  });

  it("Verify copy box cURL command text flavor 2", () => {
    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "American Fork");

    //Confirmed
    cy.findByRole("checkbox", { name: "Yes" }).click({ force: true });

    //State
    cy.selectOption("input-state", "florida");

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitName":["American Fork"],"confirmed":["Y"],"state":["FL"]},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/sources`
        );
      });
  });

  it("Verify copy box cURL command text flavor 3", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "MT40Q001_011");

    //Cause Name
    cy.selectOption("input-causeName", "algae");

    //Confirmed
    cy.findByRole("checkbox", { name: "No" }).click({ force: true });

    //Organization Name
    cy.selectOption("input-organizationName", "wisconsin");

    //State
    cy.selectOption("input-state", "hawaii");

    //Water Type
    cy.selectOption("input-waterType", "wash");

    //File Format
    cy.findByText("JavaScript Object Notation (JSON)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitId":["MT40Q001_011"],"causeName":["ALGAE"],"confirmed":["N"],"organizationName":["Wisconsin"],"state":["HI"],"waterType":["WASH"]},"options":{"format":"json"}}'
          )} ${origin}/attains/data/sources`
        );
      });
  });

  it("Verify copy box cURL command text flavor 4", () => {
    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "American Fork");

    //Cause Name
    cy.selectOption("input-causeName", "ammonia");

    //Confirmed
    cy.findByRole("checkbox", { name: "Yes" }).click({ force: true });

    //EPA IR Category
    cy.selectOption("input-epaIrCategory", "4a");

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Overall Status
    cy.selectOption("input-overallStatus", "fully");

    //Parameter Group
    cy.selectOption("input-parameterGroup", "trash");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("2016");
    cy.get("#input-reportingCycleHi").type("2019");

    //Source Name
    cy.selectOption("input-sourceName", "pipeline");

    //State
    cy.selectOption("input-state", "florida");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitName":["American Fork"],"causeName":["AMMONIA"],"confirmed":["Y"],"epaIrCategory":["4A"],"organizationId":["21PA"],"overallStatus":["Fully Supporting"],"parameterGroup":["TRASH"],"sourceName":["PIPELINE BREAKS"],"state":["FL"],"reportingCycleLo":"2016","reportingCycleHi":"2019"},"options":{"format":"tsv"}}'
          )} ${origin}/attains/data/sources`
        );
      });
  });

  it("Verify copy box cURL command text flavor 5", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "SD-BA-L-FREEMAN_01");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "agency creek");

    //Cause Name
    cy.selectOption("input-causeName", "aldrin");

    //Confirmed
    cy.findByRole("checkbox", { name: "No" }).click({ force: true });

    //EPA IR Category
    cy.selectOption("input-epaIrCategory", "4b");

    //Organization ID
    cy.selectOption("input-organizationId", "taospblo");

    //Organization Name
    cy.selectOption("input-organizationName", "district");

    //Overall Status
    cy.selectOption("input-overallStatus", "fully");

    //Parameter Group
    cy.selectOption("input-parameterGroup", "pesticides");

    //Region
    cy.selectOption("input-region", "03");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("2003");
    cy.get("#input-reportingCycleHi").type("2015");

    //Source Name
    cy.selectOption("input-sourceName", "groundwater");

    //State
    cy.selectOption("input-state", "illinois");

    //State IR Category
    cy.selectOption("input-stateIrCategory", "standards met");

    //Water Type
    cy.selectOption("input-waterType", "wetlands, tidal");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitId":["SD-BA-L-FREEMAN_01"],"assessmentUnitName":["Agency Creek"],"causeName":["ALDRIN"],"confirmed":["N"],"epaIrCategory":["4B"],"organizationId":["TAOSPBLO"],"organizationName":["District of Columbia"],"overallStatus":["Fully Supporting"],"parameterGroup":["PESTICIDES"],"region":["03"],"sourceName":["GROUNDWATER LOADINGS"],"state":["IL"],"stateIrCategory":["2P"],"waterType":["WETLANDS, TIDAL"],"reportingCycleLo":"2003","reportingCycleHi":"2015"},"options":{"format":"xlsx"}}'
          )} ${origin}/attains/data/sources`
        );
      });
  });
});
