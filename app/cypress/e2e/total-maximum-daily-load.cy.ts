describe("Data Profile Total Maximum Daily Load", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.selectProfile("Total Maximum Daily Load");
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
          `${origin}/attains/#dataProfile=tmdl&format=csv`
        );
      });
  });

  it("Verify copy box Current Query text flavor 2", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "EPA" }).click({ force: true });

    //NPDES ID
    cy.selectOption("input-npdesIdentifier", "477001");

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=tmdl&format=csv&actionAgency=E&npdesIdentifier=477001`
        );
      });
  });

  it("Verify copy box Current Query text flavor 3", () => {
    //Action Name
    cy.selectOption("input-actionName", "ks big blue");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });

    //Completion Date
    cy.get("#input-completionDateLo").type("1955-10-03");
    cy.get("#input-completionDateHi").type("1992-12-18");

    //Explicit Margin of Safety
    cy.selectOption("input-explicitMarginOfSafety", "10.3");

    //Fiscal Year Established
    cy.get("#input-fiscalYearEstablishedLo").type("1984");
    cy.get("#input-fiscalYearEstablishedHi").type("2023");

    //Implicit Margin of Safety
    cy.selectOption("input-implicitMarginOfSafety", "implicit due");

    //NPDES ID
    cy.selectOption("input-npdesIdentifier", "477001");

    //Source Type
    cy.findByRole("checkbox", { name: "Point / Nonpoint source" }).click({
      force: true,
    });

    //TMDL Date
    cy.get("#input-tmdlDateLo").type("1956-01-04");
    cy.get("#input-tmdlDateHi").type("2020-07-11");

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=tmdl&format=csv&actionName=KS Big Blue River TMDL&assessmentUnitStatus=A&explicitMarginOfSafety=10.3 acre-feet per year&implicitMarginOfSafety=Implicit due to conservative assumptions&npdesIdentifier=477001&sourceType=Both&completionDateLo=10-03-1955&completionDateHi=12-18-1992&tmdlDateLo=01-04-1956&tmdlDateHi=07-11-2020&fiscalYearEstablishedLo=1984&fiscalYearEstablishedHi=2023`
        );
      });
  });

  it("Verify copy box Current Query text flavor 4", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "EPA" }).click({ force: true });

    //Action ID
    cy.selectOption("input-actionId", "ia7001");

    //Action Name
    cy.selectOption("input-actionName", "cedar creek");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Retired" }).click({ force: true });

    //Completion Date
    cy.get("#input-completionDateLo").type("1987-11-02");
    cy.get("#input-completionDateHi").type("1991-12-16");

    //Fiscal Year Established
    cy.get("#input-fiscalYearEstablishedLo").type("2014");
    cy.get("#input-fiscalYearEstablishedHi").type("2018");

    //In Indian Country
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Organization ID
    cy.selectOption("input-organizationId", "21awic");

    //Organization Name
    cy.selectOption("input-organizationName", "oklahoma");

    //Other Identifier
    cy.selectOption("input-otherIdentifier", "city of belvue");

    //Source Type
    cy.findByRole("checkbox", { name: "Nonpoint source" }).click({
      force: true,
    });

    //TMDL Date
    cy.get("#input-tmdlDateLo").type("1993-08-05");
    cy.get("#input-tmdlDateHi").type("1994-03-09");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=tmdl&format=tsv&actionAgency=E&actionId=IA7001&actionName=Cedar Creek E. coli TMDL&assessmentUnitStatus=R&inIndianCountry=Y&organizationId=21AWIC&organizationName=Oklahoma&otherIdentifier=City of Belvue&sourceType=Nonpoint source&completionDateLo=11-02-1987&completionDateHi=12-16-1991&tmdlDateLo=08-05-1993&tmdlDateHi=03-09-1994&fiscalYearEstablishedLo=2014&fiscalYearEstablishedHi=2018`
        );
      });
  });

  it("Verify copy box Current Query text flavor 5", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });

    //Action ID
    cy.selectOption("input-actionId", "70200");

    //Action Name
    cy.selectOption("input-actionName", "bear creek");

    //Addressed Parameter
    cy.selectOption("input-addressedParameter", "algae");

    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "fl1382g");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "ash cr");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    //Completion Date
    cy.get("#input-completionDateLo").type("2009-12-08");
    cy.get("#input-completionDateHi").type("2017-09-08");

    //Explicit Margin of Safety
    cy.selectOption("input-explicitMarginOfSafety", "1.21E");

    //Fiscal Year Established
    cy.get("#input-fiscalYearEstablishedLo").type("2008");
    cy.get("#input-fiscalYearEstablishedHi").type("2019");

    //Implicit Margin of Safety
    cy.selectOption("input-implicitMarginOfSafety", "tss target based");

    //Include in Measure
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 0 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //In Indian Country
    cy.findAllByRole("checkbox", { name: "No" }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //NPDES ID
    cy.selectOption("input-npdesIdentifier", "59925");

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Organization Name
    cy.selectOption("input-organizationName", "florida");

    //Other Identifier
    cy.selectOption("input-otherIdentifier", "bpu");

    //Pollutant
    cy.selectOption("input-pollutant", "cfc-113");

    //Region
    cy.selectOption("input-region", "06");

    //Source Type
    cy.findByRole("checkbox", { name: "Point source" }).click({ force: true });

    //TMDL Date
    cy.get("#input-tmdlDateLo").type("2019-12-08");
    cy.get("#input-tmdlDateHi").type("2022-09-30");

    //Water Type
    cy.selectOption("input-waterType", "harbor");

    //File Format
    cy.findByText("JavaScript Object Notation (JSON)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=tmdl&format=json&actionAgency=T&actionId=70200&actionName=Bear Creek Unknown TMDL REVISED&addressedParameter=ALGAE&assessmentUnitId=FL1382G&assessmentUnitName=Ash Cr&assessmentUnitStatus=H&explicitMarginOfSafety=1.21E+09&implicitMarginOfSafety=TSS target based on the 25th percentile concentration of all USGS TSS data from Missouri in the EDU where Mound Branch is located.&includeInMeasure=Y&inIndianCountry=N&npdesIdentifier=59925&organizationId=21PA&organizationName=Florida&otherIdentifier=BPU Kaw Power Station&pollutant=CFC-113&region=06&sourceType=Point source&waterType=HARBOR&completionDateLo=12-08-2009&completionDateHi=09-08-2017&tmdlDateLo=12-08-2019&tmdlDateHi=09-30-2022&fiscalYearEstablishedLo=2008&fiscalYearEstablishedHi=2019`
        );
      });
  });

  it("Verify copy box Total Maximum Daily Load API Query text flavor 1", () => {
    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/tmdl?format=csv`
        );
      });
  });

  it("Verify copy box Total Maximum Daily Load API Query text flavor 2", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "State" }).click({ force: true });

    //Completion Date
    cy.get("#input-completionDateLo").type("1955-10-03");
    cy.get("#input-completionDateHi").type("1992-12-18");

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/tmdl?format=csv&actionAgency=S&completionDateLo=10-03-1955&completionDateHi=12-18-1992`
        );
      });
  });

  it("Verify copy box Total Maximum Daily Load API Query text flavor 3", () => {
    //Action ID
    cy.selectOption("input-actionId", "fl64445");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });

    //Explicit Margin of Safety
    cy.selectOption("input-explicitMarginOfSafety", "10.3");

    //Include in Measure
    cy.findAllByRole("checkbox", { name: "No" }).each(($elem, index) => {
      index === 0 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //NPDES ID
    cy.selectOption("input-npdesIdentifier", "477001");

    //Organization ID
    cy.selectOption("input-organizationId", "taospblo");

    //Organization Name
    cy.selectOption("input-organizationName", "kansas");

    //Source Type
    cy.findByRole("checkbox", { name: "Point / Nonpoint source" }).click({
      force: true,
    });

    //TMDL Date
    cy.get("#input-tmdlDateLo").type("1956-01-04");
    cy.get("#input-tmdlDateHi").type("2020-07-11");

    //Water Type
    cy.selectOption("input-waterType", "lagoon");

    //File Format
    cy.findByText("Comma-separated (CSV)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/tmdl?format=csv&actionId=FL64445&assessmentUnitStatus=A&explicitMarginOfSafety=10.3 acre-feet per year&includeInMeasure=N&npdesIdentifier=477001&organizationId=TAOSPBLO&organizationName=Kansas&sourceType=Both&waterType=LAGOON&tmdlDateLo=01-04-1956&tmdlDateHi=07-11-2020`
        );
      });
  });

  it("Verify copy box Total Maximum Daily Load API Query text flavor 4", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "State" }).click({ force: true });

    //Action ID
    cy.selectOption("input-actionId", "fl64445");

    //Addressed Parameter
    cy.selectOption("input-addressedParameter", "enterococcus");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });

    //Explicit Margin of Safety
    cy.selectOption("input-explicitMarginOfSafety", "10.3");

    //Fiscal Year Established
    cy.get("#input-fiscalYearEstablishedLo").type("1984");
    cy.get("#input-fiscalYearEstablishedHi").type("2023");

    //Implicit Margin of Safety
    cy.selectOption("input-implicitMarginOfSafety", "implicit due");

    //In Indian Country
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Organization ID
    cy.selectOption("input-organizationId", "taospblo");

    //Organization Name
    cy.selectOption("input-organizationName", "kansas");

    //Pollutant
    cy.selectOption("input-pollutant", "molinate");

    //Source Type
    cy.findByRole("checkbox", { name: "Point / Nonpoint source" }).click({
      force: true,
    });

    //TMDL Date
    cy.get("#input-tmdlDateLo").type("1956-01-04");
    cy.get("#input-tmdlDateHi").type("2020-07-11");

    //File Format
    cy.findByText("Comma-separated (CSV)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/tmdl?format=csv&actionAgency=S&actionId=FL64445&addressedParameter=ENTEROCOCCUS&assessmentUnitStatus=A&explicitMarginOfSafety=10.3 acre-feet per year&implicitMarginOfSafety=Implicit due to conservative assumptions&inIndianCountry=Y&organizationId=TAOSPBLO&organizationName=Kansas&pollutant=MOLINATE&sourceType=Both&tmdlDateLo=01-04-1956&tmdlDateHi=07-11-2020&fiscalYearEstablishedLo=1984&fiscalYearEstablishedHi=2023`
        );
      });
  });

  it("Verify copy box Total Maximum Daily Load API Query text flavor 5", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "EPA" }).click({ force: true });

    //Action ID
    cy.selectOption("input-actionId", "ia7001");

    //Action Name
    cy.selectOption("input-actionName", "cedar creek");

    //Addressed Parameter
    cy.selectOption("input-addressedParameter", "copper");

    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "fl1389");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "banner cr");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Retired" }).click({ force: true });

    //Completion Date
    cy.get("#input-completionDateLo").type("1987-11-02");
    cy.get("#input-completionDateHi").type("1991-12-16");

    //Explicit Margin of Safety
    cy.selectOption("input-explicitMarginOfSafety", "1.03e");

    //Fiscal Year Established
    cy.get("#input-fiscalYearEstablishedLo").type("2014");
    cy.get("#input-fiscalYearEstablishedHi").type("2018");

    //Implicit Margin of Safety
    cy.selectOption("input-implicitMarginOfSafety", "25th per");

    //Include in Measure
    cy.findAllByRole("checkbox", { name: "No" }).each(($elem, index) => {
      index === 0 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //In Indian Country
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //NPDES ID
    cy.selectOption("input-npdesIdentifier", "60069");

    //Organization ID
    cy.selectOption("input-organizationId", "21awic");

    //Organization Name
    cy.selectOption("input-organizationName", "oklahoma");

    //Other Identifier
    cy.selectOption("input-otherIdentifier", "city of belvue");

    //Pollutant
    cy.selectOption("input-pollutant", "cyanide");

    //Region
    cy.selectOption("input-region", "07");

    //Source Type
    cy.findByRole("checkbox", { name: "Nonpoint source" }).click({
      force: true,
    });

    //TMDL Date
    cy.get("#input-tmdlDateLo").type("1993-08-05");
    cy.get("#input-tmdlDateHi").type("1994-03-09");

    //Water Type
    cy.selectOption("input-waterType", "bayou");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/tmdl?format=tsv&actionAgency=E&actionId=IA7001&actionName=Cedar Creek E. coli TMDL&addressedParameter=COPPER&assessmentUnitId=FL1389&assessmentUnitName=Banner Cr&assessmentUnitStatus=R&explicitMarginOfSafety=1.03e10&implicitMarginOfSafety=25th percentile of EDU data&includeInMeasure=N&inIndianCountry=Y&npdesIdentifier=60069&organizationId=21AWIC&organizationName=Oklahoma&otherIdentifier=City of Belvue&pollutant=CYANIDE&region=07&sourceType=Nonpoint source&waterType=BAYOU&completionDateLo=11-02-1987&completionDateHi=12-16-1991&tmdlDateLo=08-05-1993&tmdlDateHi=03-09-1994&fiscalYearEstablishedLo=2014&fiscalYearEstablishedHi=2018`
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
          )} ${origin}/attains/data/tmdl`
        );
      });
  });

  it("Verify copy box cURL command text flavor 2", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });

    //Action Name
    cy.selectOption("input-actionName", "bear creek");

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"actionAgency":["T"],"actionName":["Bear Creek Unknown TMDL REVISED"]},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/tmdl`
        );
      });
  });

  it("Verify copy box cURL command text flavor 3", () => {
    //Action Name
    cy.selectOption("input-actionName", "cedar creek");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Retired" }).click({ force: true });

    //Explicit Margin of Safety
    cy.selectOption("input-explicitMarginOfSafety", "1.03e");

    //Fiscal Year Established
    cy.get("#input-fiscalYearEstablishedLo").type("2014");
    cy.get("#input-fiscalYearEstablishedHi").type("2018");

    //Implicit Margin of Safety
    cy.selectOption("input-implicitMarginOfSafety", "25th per");

    //NPDES ID
    cy.selectOption("input-npdesIdentifier", "60069");

    //Other Identifier
    cy.selectOption("input-otherIdentifier", "city of belvue");

    //File Format
    cy.findByText("Tab-separated (TSV)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"actionName":["Cedar Creek E. coli TMDL"],"assessmentUnitStatus":["R"],"explicitMarginOfSafety":["1.03e10"],"implicitMarginOfSafety":["25th percentile of EDU data"],"npdesIdentifier":["60069"],"otherIdentifier":["City of Belvue"],"fiscalYearEstablishedLo":"2014","fiscalYearEstablishedHi":"2018"},"options":{"format":"tsv"}}'
          )} ${origin}/attains/data/tmdl`
        );
      });
  });

  it("Verify copy box cURL command text flavor 4", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });

    //Action ID
    cy.selectOption("input-actionId", "70200");

    //Action Name
    cy.selectOption("input-actionName", "bear creek");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Historical" }).click({ force: true });

    //Fiscal Year Established
    cy.get("#input-fiscalYearEstablishedLo").type("2008");
    cy.get("#input-fiscalYearEstablishedHi").type("2019");

    //Implicit Margin of Safety
    cy.selectOption("input-implicitMarginOfSafety", "tss target based");

    //Include in Measure
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 0 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //NPDES ID
    cy.selectOption("input-npdesIdentifier", "59925");

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Source Type
    cy.findByRole("checkbox", { name: "Point source" }).click({ force: true });

    //TMDL Date
    cy.get("#input-tmdlDateLo").type("2019-12-08");
    cy.get("#input-tmdlDateHi").type("2022-09-30");

    //File Format
    cy.findByText("JavaScript Object Notation (JSON)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"actionAgency":["T"],"actionId":["70200"],"actionName":["Bear Creek Unknown TMDL REVISED"],"assessmentUnitStatus":["H"],"implicitMarginOfSafety":["TSS target based on the 25th percentile concentration of all USGS TSS data from Missouri in the EDU where Mound Branch is located."],"includeInMeasure":["Y"],"npdesIdentifier":["59925"],"organizationId":["21PA"],"sourceType":["Point source"],"tmdlDateLo":"12-08-2019","tmdlDateHi":"09-30-2022","fiscalYearEstablishedLo":"2008","fiscalYearEstablishedHi":"2019"},"options":{"format":"json"}}'
          )} ${origin}/attains/data/tmdl`
        );
      });
  });

  it("Verify copy box cURL command text flavor 5", () => {
    //Action Agency
    cy.findByRole("checkbox", { name: "State" }).click({ force: true });

    //Action ID
    cy.selectOption("input-actionId", "fl64445");

    //Action Name
    cy.selectOption("input-actionName", "ks big blue");

    //Addressed Parameter
    cy.selectOption("input-addressedParameter", "enterococcus");

    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "fl1488c");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "big blue r");

    //Assessment Unit Status
    cy.findByRole("checkbox", { name: "Active" }).click({ force: true });

    //Completion Date
    cy.get("#input-completionDateLo").type("1955-10-03");
    cy.get("#input-completionDateHi").type("1992-12-18");

    //Explicit Margin of Safety
    cy.selectOption("input-explicitMarginOfSafety", "10.3");

    //Fiscal Year Established
    cy.get("#input-fiscalYearEstablishedLo").type("1984");
    cy.get("#input-fiscalYearEstablishedHi").type("2023");

    //Implicit Margin of Safety
    cy.selectOption("input-implicitMarginOfSafety", "implicit due");

    //Include in Measure
    cy.findAllByRole("checkbox", { name: "No" }).each(($elem, index) => {
      index === 0 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //In Indian Country
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //NPDES ID
    cy.selectOption("input-npdesIdentifier", "477001");

    //Organization ID
    cy.selectOption("input-organizationId", "taospblo");

    //Organization Name
    cy.selectOption("input-organizationName", "kansas");

    //Other Identifier
    cy.selectOption("input-otherIdentifier", "city of abilene");

    //Pollutant
    cy.selectOption("input-pollutant", "molinate");

    //Region
    cy.selectOption("input-region", "04");

    //Source Type
    cy.findByRole("checkbox", { name: "Point / Nonpoint source" }).click({
      force: true,
    });

    //TMDL Date
    cy.get("#input-tmdlDateLo").type("1956-01-04");
    cy.get("#input-tmdlDateHi").type("2020-07-11");

    //Water Type
    cy.selectOption("input-waterType", "lagoon");

    //File Format
    cy.findByText("Comma-separated (CSV)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"actionAgency":["S"],"actionId":["FL64445"],"actionName":["KS Big Blue River TMDL"],"addressedParameter":["ENTEROCOCCUS"],"assessmentUnitId":["FL1488C"],"assessmentUnitName":["Big Blue R"],"assessmentUnitStatus":["A"],"explicitMarginOfSafety":["10.3 acre-feet per year"],"implicitMarginOfSafety":["Implicit due to conservative assumptions"],"includeInMeasure":["N"],"inIndianCountry":["Y"],"npdesIdentifier":["477001"],"organizationId":["TAOSPBLO"],"organizationName":["Kansas"],"otherIdentifier":["City of Abilene"],"pollutant":["MOLINATE"],"region":["04"],"sourceType":["Both"],"waterType":["LAGOON"],"completionDateLo":"10-03-1955","completionDateHi":"12-18-1992","tmdlDateLo":"01-04-1956","tmdlDateHi":"07-11-2020","fiscalYearEstablishedLo":"1984","fiscalYearEstablishedHi":"2023"},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/tmdl`
        );
      });
  });
});
