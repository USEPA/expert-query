describe("Data Profile Assessment Units", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.selectProfile("Assessment Units");
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
          `${origin}/attains/assessmentUnits/#format=csv`
        );
      });
  });

  it("Verify copy box Current Query text flavor 2", () => {
    cy.findByRole("checkbox", { name: "Retired" }).click({ force: true });

    cy.selectOption("input-state", "florida");
    cy.selectOption("input-state", "nebraska");

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/assessmentUnits/#format=csv&assessmentUnitState=R&state=FL&state=NE`
        );
      });
  });

  it("Verify copy box Current Query text flavor 3", () => {
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    cy.selectOption("input-assessmentUnitId", "AA_SC_Steele_01b");

    cy.selectOption("input-locationText", "blackwater");

    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/assessmentUnits/#format=tsv&assessmentUnitId=AA_SC_Steele_01b&assessmentUnitState=H&locationText=Blackwater`
        );
      });
  });

  it("Verify copy box Current Query text flavor 4", () => {
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });

    cy.selectOption("input-organizationName", "montana");

    cy.selectOption("input-useClassName", "pl");

    cy.selectOption("input-waterType", "wash");

    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/assessmentUnits/#format=xlsx&assessmentUnitState=H&assessmentUnitState=A&organizationName=Montana&useClassName=PL&waterType=WASH`
        );
      });
  });

  it("Verify copy box Current Query text flavor 5", () => {
    //Assessment Unit State
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });
    cy.findByRole("checkbox", { name: "Retired" }).click({ force: true });
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "AL-Gulf-of-Mexico-1");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "ada lake");

    //Location Text
    cy.selectOption("input-locationText", "alabama");

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Organization Name
    cy.selectOption("input-organizationName", "tennessee");

    //Region
    cy.selectOption("input-region", "08");

    //State
    cy.selectOption("input-state", "ohio");

    //Use Class Name
    cy.selectOption("input-useClassName", "l2");

    //Water Type
    cy.selectOption("input-waterType", "bayou");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/assessmentUnits/#format=xlsx&assessmentUnitId=AL-Gulf-of-Mexico-1&assessmentUnitName=Ada Lake&assessmentUnitState=A&assessmentUnitState=R&assessmentUnitState=H&locationText=Alabama&organizationId=21PA&organizationName=Tennessee&region=08&state=OH&useClassName=L2&waterType=BAYOU`
        );
      });
  });

  it("Verify copy box Assessment Units API Query text flavor 1", () => {
    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessmentUnits?format=csv`
        );
      });
  });

  it("Verify copy box Assessment Units API Query text flavor 2", () => {
    cy.findByRole("checkbox", { name: "Retired" }).click({ force: true });

    cy.selectOption("input-locationText", "adams county");

    cy.selectOption("input-assessmentUnitId", "AL-Gulf-of-Mexico-2");

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessmentUnits?format=csv&assessmentUnitId=AL-Gulf-of-Mexico-2&assessmentUnitState=R&locationText=Adams County`
        );
      });
  });

  it("Verify copy box Assessment Units API Query text flavor 3", () => {
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    cy.selectOption("input-organizationName", "wisconsin");

    cy.selectOption("input-waterType", "ocean");

    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessmentUnits?format=tsv&assessmentUnitState=H&organizationName=Wisconsin&waterType=OCEAN`
        );
      });
  });

  it("Verify copy box Assessment Units API Query text flavor 4", () => {
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });

    cy.selectOption("input-organizationId", "sfnoes");

    cy.selectOption("input-state", "texas");

    cy.selectOption("input-useClassName", "vii");

    cy.findByText("JavaScript Object Notation (JSON)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessmentUnits?format=json&assessmentUnitState=A&organizationId=SFNOES&state=TX&useClassName=VII`
        );
      });
  });

  it("Verify copy box Assessment Units API Query text flavor 5", () => {
    //Assessment Unit State
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });
    cy.findByRole("checkbox", { name: "Retired" }).click({ force: true });
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "MT40C001_010");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "aikin creek");

    //Location Text
    cy.selectOption("input-locationText", "custer county");

    //Organization ID
    cy.selectOption("input-organizationId", "usvist");

    //Organization Name
    cy.selectOption("input-organizationName", "north dakota");

    //Region
    cy.selectOption("input-region", "04");

    //State
    cy.selectOption("input-state", "utah");

    //Use Class Name
    cy.selectOption("input-useClassName", "fw1");

    //Water Type
    cy.selectOption("input-waterType", "sound");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessmentUnits?format=xlsx&assessmentUnitId=MT40C001_010&assessmentUnitName=Aikin Creek&assessmentUnitState=A&assessmentUnitState=R&assessmentUnitState=H&locationText=Custer County&organizationId=USVIST&organizationName=North Dakota&region=04&state=UT&useClassName=FW1&waterType=SOUND`
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
          )} ${origin}/attains/data/assessmentUnits`
        );
      });
  });

  it("Verify copy box cURL command text flavor 2", () => {
    cy.findByRole("checkbox", { name: "Retired" }).click({ force: true });

    cy.selectOption("input-locationText", "buffalo county");

    cy.selectOption("input-assessmentUnitId", "AL-Gulf-of-Mexico-2");

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitId":["AL-Gulf-of-Mexico-2"],"assessmentUnitState":["R"],"locationText":["Buffalo County"]},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/assessmentUnits`
        );
      });
  });

  it("Verify copy box cURL command text flavor 3", () => {
    cy.findByRole("checkbox", { name: "Retired" }).click({ force: true });

    cy.selectOption("input-organizationName", "wisconsin");

    cy.selectOption("input-waterType", "ocean");

    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitState":["R"],"organizationName":["Wisconsin"],"waterType":["OCEAN"]},"options":{"format":"tsv"}}'
          )} ${origin}/attains/data/assessmentUnits`
        );
      });
  });

  it("Verify copy box cURL command text flavor 4", () => {
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });

    cy.selectOption("input-organizationName", "montana");

    cy.selectOption("input-useClassName", "a-1");

    cy.selectOption("input-waterType", "pond");

    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitState":["H","A"],"organizationName":["Montana"],"useClassName":["A-1"],"waterType":["POND"]},"options":{"format":"xlsx"}}'
          )} ${origin}/attains/data/assessmentUnits`
        );
      });
  });

  it("Verify copy box cURL command text flavor 5", () => {
    //Assessment Unit State
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });
    cy.findByRole("checkbox", { name: "Retired" }).click({ force: true });
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "MT41G002_010");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "archibald lake");

    //Location Text
    cy.selectOption("input-locationText", "green county");

    //Organization ID
    cy.selectOption("input-organizationId", "okdeq");

    //Organization Name
    cy.selectOption("input-organizationName", "tennessee");

    //Region
    cy.selectOption("input-region", "05");

    //State
    cy.selectOption("input-state", "colorado");

    //Use Class Name
    cy.selectOption("input-useClassName", "se3");

    //Water Type
    cy.selectOption("input-waterType", "flowage");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentUnitId":["MT41G002_010"],"assessmentUnitName":["Archibald Lake"],"assessmentUnitState":["A","R","H"],"locationText":["Green County"],"organizationId":["OKDEQ"],"organizationName":["Tennessee"],"region":["05"],"state":["CO"],"useClassName":["SE3"],"waterType":["FLOWAGE"]},"options":{"format":"xlsx"}}'
          )} ${origin}/attains/data/assessmentUnits`
        );
      });
  });
});
