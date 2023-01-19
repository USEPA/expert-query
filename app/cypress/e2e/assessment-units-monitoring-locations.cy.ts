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

  it("Verify copy box Current Query text flavor 1", () => {
    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=assessmentUnitsMonitoringLocations&format=csv`
        );
      });
  });

  it("Verify copy box Current Query text flavor 2", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "delawarenation-1300");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Retired" }).click({ force: true });

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=assessmentUnitsMonitoringLocations&format=csv&assessmentUnitId=DELAWARENATION-1300&assessmentUnitStatus=R`
        );
      });
  });

  it("Verify copy box Current Query text flavor 3", () => {
    //Organization Name
    cy.selectOption("input-organizationName", "wyoming");

    //State
    cy.selectOption("input-state", "oklahoma");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("2015");
    cy.get("#input-reportingCycleHi").type("2023");

    //File Format
    cy.findByText("JavaScript Object Notation (JSON)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=assessmentUnitsMonitoringLocations&format=json&organizationName=Wyoming&state=OK&reportingCycleLo=2015&reportingCycleHi=2023`
        );
      });
  });

  it("Verify copy box Current Query text flavor 4", () => {
    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "ashley lake");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });

    //Monitoring Location Organization ID
    cy.selectOption("input-monitoringLocationOrgId", "21awic");

    //Organization Name
    cy.selectOption("input-organizationName", "wyoming");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=assessmentUnitsMonitoringLocations&format=xlsx&assessmentUnitName=Ashley Lake&assessmentUnitStatus=A&monitoringLocationOrgId=21AWIC&organizationName=Wyoming`
        );
      });
  });

  it("Verify copy box Current Query text flavor 5", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "dn_am_watershed-2");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "alder gulch");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    //Monitoring Location ID
    cy.selectOption("input-monitoringLocationId", "a15");

    //Monitoring Location Organization ID
    cy.selectOption("input-monitoringLocationOrgId", "mdeq_mpdes_wqx");

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Organization Name
    cy.selectOption("input-organizationName", "montana");

    //Region
    cy.selectOption("input-region", "08");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("2015");
    cy.get("#input-reportingCycleHi").type("2023");

    //State
    cy.selectOption("input-state", "colorado");

    //Use Class Name
    cy.selectOption("input-useClassName", "pl");

    //Water Type
    cy.selectOption("input-waterType", "sound");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=assessmentUnitsMonitoringLocations&format=tsv&assessmentUnitId=DN_AM_Watershed-2&assessmentUnitName=Alder Gulch&assessmentUnitStatus=H&monitoringLocationId=A15&monitoringLocationOrgId=MDEQ_MPDES_WQX&organizationId=21PA&organizationName=Montana&region=08&state=CO&useClassName=PL&waterType=SOUND&reportingCycleLo=2015&reportingCycleHi=2023`
        );
      });
  });

  it("Verify copy box Assessment Units with Monitoring Locations API Query text flavor 1", () => {
    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessmentUnitsMonitoringLocations?format=csv`
        );
      });
  });

  it("Verify copy box Assessment Units with Monitoring Locations API Query text flavor 2", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "dn_am_watershed-2");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "american creek");

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessmentUnitsMonitoringLocations?format=csv&assessmentUnitId=DN_AM_Watershed-2&assessmentUnitName=American Creek`
        );
      });
  });

  it("Verify copy box Assessment Units with Monitoring Locations API Query text flavor 3", () => {
    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    //Monitoring Location Organization ID
    cy.selectOption("input-monitoringLocationOrgId", "tswqc_wqx");

    //Use Class Name
    cy.selectOption("input-useClassName", "non-class");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessmentUnitsMonitoringLocations?format=xlsx&assessmentUnitStatus=H&monitoringLocationOrgId=TSWQC_WQX&useClassName=NON-CLASS`
        );
      });
  });

  it("Verify copy box Assessment Units with Monitoring Locations API Query text flavor 4", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "delawarenation-1300");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("2013");
    cy.get("#input-reportingCycleHi").type("2022");

    //Water Type
    cy.selectOption("input-waterType", "harbor");

    //File Format
    cy.findByText("JavaScript Object Notation (JSON)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessmentUnitsMonitoringLocations?format=json&assessmentUnitId=DELAWARENATION-1300&assessmentUnitStatus=H&organizationId=21PA&waterType=HARBOR&reportingCycleLo=2013&reportingCycleHi=2022`
        );
      });
  });

  it("Verify copy box Assessment Units with Monitoring Locations API Query text flavor 5", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "aa_sc_steele_01a");

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
    cy.get("#input-reportingCycleLo").type("2013");
    cy.get("#input-reportingCycleHi").type("2022");

    //State
    cy.selectOption("input-state", "oklahoma");

    //Use Class Name
    cy.selectOption("input-useClassName", "vii");

    //Water Type
    cy.selectOption("input-waterType", "harbor");

    //File Format
    cy.findByText("JavaScript Object Notation (JSON)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessmentUnitsMonitoringLocations?format=json&assessmentUnitId=AA_SC_Steele_01a&assessmentUnitName=Ashley Lake&assessmentUnitStatus=A&monitoringLocationId=A10&monitoringLocationOrgId=21AWIC&organizationId=REDLAKE&organizationName=Wyoming&region=04&state=OK&useClassName=VII&waterType=HARBOR&reportingCycleLo=2013&reportingCycleHi=2022`
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
          )} ${origin}/attains/data/assessmentUnitsMonitoringLocations`
        );
      });
  });

  it("Verify copy box cURL command text flavor 2", () => {
    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "alder gulch");

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitName":["Alder Gulch"],"organizationId":["21PA"]},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/assessmentUnitsMonitoringLocations`
        );
      });
  });

  it("Verify copy box cURL command text flavor 3", () => {
    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });

    //Monitoring Location Organization ID
    cy.selectOption("input-monitoringLocationOrgId", "21awic");

    //Organization Name
    cy.selectOption("input-organizationName", "montana");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitStatus":["A"],"monitoringLocationOrgId":["21AWIC"],"organizationName":["Montana"]},"options":{"format":"tsv"}}'
          )} ${origin}/attains/data/assessmentUnitsMonitoringLocations`
        );
      });
  });

  it("Verify copy box cURL command text flavor 4", () => {
    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "alder gulch");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    //Organization Name
    cy.selectOption("input-organizationName", "wyoming");

    //State
    cy.selectOption("input-state", "oklahoma");

    //Water Type
    cy.selectOption("input-waterType", "sound");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitName":["Alder Gulch"],"assessmentUnitStatus":["H"],"organizationName":["Wyoming"],"state":["OK"],"waterType":["SOUND"]},"options":{"format":"tsv"}}'
          )} ${origin}/attains/data/assessmentUnitsMonitoringLocations`
        );
      });
  });

  it("Verify copy box cURL command text flavor 5", () => {
    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "delawarenation-1300");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "american creek");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Retired" }).click({ force: true });

    //Monitoring Location ID
    cy.selectOption("input-monitoringLocationId", "a12");

    //Monitoring Location Organization ID
    cy.selectOption("input-monitoringLocationOrgId", "tswqc_wqx");

    //Organization ID
    cy.selectOption("input-organizationId", "sddenr");

    //Organization Name
    cy.selectOption("input-organizationName", "tennessee");

    //Region
    cy.selectOption("input-region", "06");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("2017");
    cy.get("#input-reportingCycleHi").type("2023");

    //State
    cy.selectOption("input-state", "arizona");

    //Use Class Name
    cy.selectOption("input-useClassName", "non-class");

    //Water Type
    cy.selectOption("input-waterType", "bay");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitId":["DELAWARENATION-1300"],"assessmentUnitName":["American Creek"],"assessmentUnitStatus":["R"],"monitoringLocationId":["A12"],"monitoringLocationOrgId":["TSWQC_WQX"],"organizationId":["SDDENR"],"organizationName":["Tennessee"],"region":["06"],"state":["AZ"],"useClassName":["NON-CLASS"],"waterType":["BAY"],"reportingCycleLo":"2017","reportingCycleHi":"2023"},"options":{"format":"xlsx"}}'
          )} ${origin}/attains/data/assessmentUnitsMonitoringLocations`
        );
      });
  });
});
