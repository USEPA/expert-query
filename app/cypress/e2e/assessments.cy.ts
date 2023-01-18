describe("CopyBox with profile Assessments", () => {
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
    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=assessments&format=csv`
        );
      });
  });

  it("Verify copy box Current Query text flavor 2", () => {
    cy.selectOption("input-alternateListingIdentifier", "6226");

    cy.findByRole("checkbox", { name: "State" }).click({ force: true });

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=assessments&format=csv&alternateListingIdentifier=6226&associatedActionAgency=S`
        );
      });
  });

  it("Verify copy box Current Query text flavor 3", () => {
    cy.get("#input-assessmentDateLo").type("1999-12-31");
    cy.get("#input-assessmentDateHi").type("2023-01-16");

    cy.selectOption("input-associatedActionName", "indian fork");

    //Associated Action Status
    cy.findAllByRole("checkbox", { name: "Active" }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : "";
    });

    cy.findByRole("checkbox", { name: "Low" }).click({ force: true });

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=assessments&format=csv&associatedActionName=Indian Fork&associatedActionStatus=A&cwa303dPriorityRanking=Low&assessmentDateLo=12-31-1999&assessmentDateHi=01-16-2023`
        );
      });
  });

  it("Verify copy box Current Query text flavor 4", () => {
    //Cycle Expected to Attain
    cy.get("#input-cycleExpectedToAttainLo").type("2008");
    cy.get("#input-cycleExpectedToAttainHi").type("2022");

    cy.selectOption("input-state", "indiana");

    cy.selectOption("input-stateIrCategory", "3x");

    cy.selectOption("input-useStateIrCategory", "LEPTOPHOS");

    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=assessments&format=xlsx&state=IN&stateIrCategory=3x&useStateIrCategory=LEPTOPHOS&cycleExpectedToAttainLo=2008&cycleExpectedToAttainHi=2022`
        );
      });
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

    //Parameter State IR Category
    cy.selectOption("input-parameterStateIrCategory", "cfc-113");

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
    cy.selectOption("input-useGroup", "other");

    //Use Name
    cy.selectOption("input-useName", "scenic value");

    //Use State IR Category
    cy.selectOption("input-useStateIrCategory", "phthlate");

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

    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=assessments&format=tsv&alternateListingIdentifier=72992&assessmentBasis=Monitored Data&assessmentMethods=Fish surveys&assessmentTypes=BIOLOGICAL&assessmentUnitId=VAN-A29R_PAS01A14&assessmentUnitName=Camp&assessmentUnitStatus=H&associatedActionAgency=E&associatedActionId=1024&associatedActionName=Chartiers Creek&associatedActionStatus=A&associatedActionType=Public Meeting Held&cwa303dPriorityRanking=Medium&delisted=Y&delistedReason=NOT_SPECIFIED&epaIrCategory=4A&organizationId=21PA&organizationName=Iowa&overallStatus=Not Assessed&parameterAttainment=ALGAE&parameterGroup=OTHER CAUSE&parameterName=RADIUM&parameterStateIrCategory=CFC-113&parameterStatus=Meeting Criteria&pollutantIndicator=N&region=08&state=AZ&stateIrCategory=3x&useClassName=VII&useGroup=OTHER&useName=Scenic Value&useStateIrCategory=PHTHLATE&useSupport=N&vision303dPriority=Y&waterType=WASH&assessmentDateLo=12-26-2006&assessmentDateHi=03-09-2021&monitoringEndDateLo=06-03-2014&monitoringEndDateHi=07-16-2019&monitoringStartDateLo=08-08-2013&monitoringStartDateHi=06-23-2021&seasonEndDateLo=04-23-2014&seasonEndDateHi=03-07-2022&seasonStartDateLo=12-08-2009&seasonStartDateHi=06-03-2022&cycleExpectedToAttainLo=2010&cycleExpectedToAttainHi=2013&cycleFirstListedLo=2008&cycleFirstListedHi=2023&cycleLastAssessedLo=2007&cycleLastAssessedHi=2021&cycleScheduledForTmdlLo=2005&cycleScheduledForTmdlHi=2019&reportingCycleLo=2005&reportingCycleHi=2022`
        );
      });
  });

  it("Verify copy box Assessments API Query text flavor 1", () => {
    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessments?format=csv`
        );
      });
  });

  it("Verify copy box Assessments API Query text flavor 2", () => {
    cy.selectOption("input-alternateListingIdentifier", "72992");

    cy.findByRole("checkbox", { name: "EPA" }).click({ force: true });

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessments?format=csv&alternateListingIdentifier=72992&associatedActionAgency=E`
        );
      });
  });

  it("Verify copy box Assessments API Query text flavor 3", () => {
    cy.get("#input-cycleFirstListedLo").type("2021");
    cy.get("#input-cycleFirstListedHi").type("2023");

    cy.findByRole("checkbox", { name: "Insufficient Information" }).click({
      force: true,
    });

    cy.selectOption("input-overallStatus", "fully");

    //Delisted
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 0 ? cy.wrap($elem).click({ force: true }) : "";
    });

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessments?format=csv&delisted=Y&overallStatus=Fully Supporting&parameterStatus=Insufficient Information&cycleFirstListedLo=2021&cycleFirstListedHi=2023`
        );
      });
  });

  it("Verify copy box Assessments API Query text flavor 4", () => {
    //Assessment Type
    cy.selectOption("input-assessmentTypes", "habitat");

    //Associated Action Agency
    cy.findByRole("checkbox", { name: "State" }).click({ force: true });

    //CWA 303d Priority Ranking
    cy.findByRole("checkbox", { name: "Medium" }).click({ force: true });

    //Cycle Scheduled for TMDL
    cy.get("#input-cycleScheduledForTmdlLo").type("2013");

    //Pollutant Indicator
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Parameter State IR Category
    cy.selectOption("input-parameterStateIrCategory", "cfc-113");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessments?format=xlsx&assessmentTypes=HABITAT&associatedActionAgency=S&cwa303dPriorityRanking=Medium&parameterStateIrCategory=CFC-113&pollutantIndicator=Y&cycleScheduledForTmdlLo=2013`
        );
      });
  });

  it("Verify copy box Assessments API Query text flavor 5", () => {
    //Alternate Listing ID
    cy.selectOption("input-alternateListingIdentifier", "6524");

    //Assessment Basis
    cy.selectOption("input-assessmentBasis", "monitored & extrapolated Data");

    //Assessment Date
    cy.get("#input-assessmentDateLo").type("2003-11-26");
    cy.get("#input-assessmentDateHi").type("2020-01-04");

    //Assessment Methods
    cy.selectOption("input-assessmentMethods", "2016 Wis");

    //Assessment Type
    cy.selectOption("input-assessmentTypes", "habitat");

    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "nc17-12b");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "alligator");

    //Assessment Unit
    cy.findAllByRole("checkbox", { name: "Retired" }).each(($elem, index) => {
      index === 0 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Associated Action Agency
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });

    //Associated Action ID
    cy.selectOption("input-associatedActionId", "1083");

    //Associated Action Name
    cy.selectOption("input-associatedActionName", "beaver creek");

    //Associated Action Status
    cy.findAllByRole("checkbox", { name: "Historical" }).each(
      ($elem, index) => {
        index === 1 ? cy.wrap($elem).click({ force: true }) : "";
      }
    );

    //Associated Action Type
    cy.selectOption("input-associatedActionType", "protection");

    //CWA 303d Priority Ranking
    cy.findByRole("checkbox", { name: "Low" }).click({ force: true });

    //Cycle Expected to Attain
    cy.get("#input-cycleExpectedToAttainLo").type("2010");
    cy.get("#input-cycleExpectedToAttainHi").type("2013");

    //Cycle First
    cy.get("#input-cycleFirstListedLo").type("2015");
    cy.get("#input-cycleFirstListedHi").type("2019");

    //Cycle Last Assessed
    cy.get("#input-cycleLastAssessedLo").type("2020");
    cy.get("#input-cycleLastAssessedHi").type("2022");

    //Cycle Scheduled for TMDL
    cy.get("#input-cycleScheduledForTmdlLo").type("2005");
    cy.get("#input-cycleScheduledForTmdlHi").type("2019");

    //Delisted
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 0 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Delisted Reason
    cy.selectOption("input-delistedReason", "water deter");

    //EPA IR Category
    cy.selectOption("input-epaIrCategory", "5a");

    //Monitoring End Date
    cy.get("#input-monitoringEndDateLo").type("2016-06-03");
    cy.get("#input-monitoringEndDateHi").type("2020-07-16");

    //Monitoring Start Date
    cy.get("#input-monitoringStartDateLo").type("2013-08-08");
    cy.get("#input-monitoringStartDateHi").type("2021-06-23");

    //Organization ID
    cy.selectOption("input-organizationId", "21hi");

    //Organization Name
    cy.selectOption("input-organizationName", "delaware");

    //Overall Status
    cy.selectOption("input-overallStatus", "not su");

    //Parameter Attainment
    cy.selectOption("input-parameterAttainment", "aldrin");

    //Parameter Group
    cy.selectOption("input-parameterGroup", "total toxics");

    //Parameter Name
    cy.selectOption("input-parameterName", "mcpa");

    //Parameter State IR Category
    cy.selectOption("input-parameterStateIrCategory", "mcpa");

    //Parameter Status
    cy.findByRole("checkbox", { name: "Removed" }).click({
      force: true,
    });

    //Pollutant Indicator
    cy.findAllByRole("checkbox", { name: "No" }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Region
    cy.selectOption("input-region", "07");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("2016");
    cy.get("#input-reportingCycleHi").type("2023");

    //Season End Date
    cy.get("#input-seasonEndDateLo").type("2014-04-23");
    cy.get("#input-seasonEndDateHi").type("2022-03-07");

    //Season Start Date
    cy.get("#input-seasonStartDateLo").type("2014-12-08");
    cy.get("#input-seasonStartDateHi").type("2022-02-02");

    //State
    cy.selectOption("input-state", "texas");

    //State IR Category
    cy.selectOption("input-stateIrCategory", "the water quality");

    //Use Class Name
    cy.selectOption("input-useClassName", "pl");

    //Use Group
    cy.selectOption("input-useGroup", "other");

    //Use Name
    cy.selectOption("input-useName", "drinking water");

    //Use State IR Category
    cy.selectOption("input-useStateIrCategory", "cfc-113");

    //Use Support
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 2 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Vision 303d Priority
    cy.findAllByRole("checkbox", { name: "No" }).each(($elem, index) => {
      index === 3 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Water Type
    cy.selectOption("input-waterType", "gulf");

    //File Format
    cy.findByText("Microsoft Excel (XLSX)").click();

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/assessments?format=xlsx&alternateListingIdentifier=6524&assessmentBasis=Monitored & Extrapolated Data&assessmentMethods=2016 WisCALM Methodology&assessmentTypes=HABITAT&assessmentUnitId=NC17-12b1&assessmentUnitName=Alligator River&assessmentUnitStatus=R&associatedActionAgency=T&associatedActionId=1083&associatedActionName=BEAVER CREEK&associatedActionStatus=H&associatedActionType=Protection Approach&cwa303dPriorityRanking=Low&delisted=Y&delistedReason=DELISTING_NOT_WATER_OF_STATE&epaIrCategory=5A&organizationId=21HI&organizationName=Delaware&overallStatus=Not Supporting&parameterAttainment=ALDRIN&parameterGroup=TOTAL TOXICS&parameterName=MCPA&parameterStateIrCategory=MCPA&parameterStatus=Removed&pollutantIndicator=N&region=07&state=TX&stateIrCategory=5&useClassName=PL&useGroup=OTHER&useName=Drinking Water&useStateIrCategory=CFC-113&useSupport=Y&vision303dPriority=N&waterType=GULF&assessmentDateLo=11-26-2003&assessmentDateHi=01-04-2020&monitoringEndDateLo=06-03-2016&monitoringEndDateHi=07-16-2020&monitoringStartDateLo=08-08-2013&monitoringStartDateHi=06-23-2021&seasonEndDateLo=04-23-2014&seasonEndDateHi=03-07-2022&seasonStartDateLo=12-08-2014&seasonStartDateHi=02-02-2022&cycleExpectedToAttainLo=2010&cycleExpectedToAttainHi=2013&cycleFirstListedLo=2015&cycleFirstListedHi=2019&cycleLastAssessedLo=2020&cycleLastAssessedHi=2022&cycleScheduledForTmdlLo=2005&cycleScheduledForTmdlHi=2019&reportingCycleLo=2016&reportingCycleHi=2023`
        );
      });
  });

  it("Verify copy box cURL Command text flavor 1", () => {
    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/assessments`
        );
      });
  });

  it("Verify copy box cURL Command text flavor 2", () => {
    cy.selectOption("input-assessmentBasis", "extrapolated data");

    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"assessmentBasis":["Extrapolated Data"],"associatedActionAgency":["T"]},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/assessments`
        );
      });
  });

  it("Verify copy box cURL Command text flavor 3", () => {
    cy.get("#input-cycleExpectedToAttainLo").type("1993");
    cy.get("#input-cycleExpectedToAttainHi").type("2023");

    cy.selectOption("input-useGroup", "AGRICULTURAL");

    //Vision 303d Priority
    cy.findAllByRole("checkbox", { name: "No" }).each(($elem, index) => {
      index === 3 ? cy.wrap($elem).click({ force: true }) : "";
    });

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"useGroup":["AGRICULTURAL"],"vision303dPriority":["N"],"cycleExpectedToAttainLo":"1993","cycleExpectedToAttainHi":"2023"},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/assessments`
        );
      });
  });

  it("Verify copy box cURL Command text flavor 4", () => {
    //Monitoring Start Date
    cy.get("#input-monitoringStartDateLo").type("2013-08-08");
    cy.get("#input-monitoringStartDateHi").type("2021-06-23");

    //Organization Name
    cy.selectOption("input-organizationName", "delaware");

    //Parameter Status
    cy.findByRole("checkbox", { name: "Observed effect" }).click({
      force: true,
    });

    //Season End Date
    cy.get("#input-seasonEndDateLo").type("2019-04-23");
    cy.get("#input-seasonEndDateHi").type("2023-01-04");

    cy.findByText("JavaScript Object Notation (JSON)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"organizationName":["Delaware"],"parameterStatus":["Observed effect"],"monitoringStartDateLo":"08-08-2013","monitoringStartDateHi":"06-23-2021","seasonEndDateLo":"04-23-2019","seasonEndDateHi":"01-04-2023"},"options":{"format":"json"}}'
          )} ${origin}/attains/data/assessments`
        );
      });
  });

  it("Verify copy box cURL Command text flavor 5", () => {
    //Alternate Listing ID
    cy.selectOption("input-alternateListingIdentifier", "77914");

    //Assessment Basis
    cy.selectOption("input-assessmentBasis", "extrapolated data");

    //Assessment Date
    cy.get("#input-assessmentDateLo").type("2017-08-09");
    cy.get("#input-assessmentDateHi").type("2022-02-14");

    //Assessment Methods
    cy.selectOption("input-assessmentMethods", "ecological");

    //Assessment Type
    cy.selectOption("input-assessmentTypes", "other");

    //Assessment Unit ID
    cy.selectOption("input-assessmentUnitId", "DCTOR01R_00");

    //Assessment Unit Name
    cy.selectOption("input-assessmentUnitName", "jones");

    //Assessment Unit
    cy.findAllByRole("checkbox", { name: "Historical" }).each(
      ($elem, index) => {
        index === 0 ? cy.wrap($elem).click({ force: true }) : "";
      }
    );

    //Associated Action Agency
    cy.findByRole("checkbox", { name: "Tribal" }).click({ force: true });

    //Associated Action ID
    cy.selectOption("input-associatedActionId", "1027");

    //Associated Action Name
    cy.selectOption("input-associatedActionName", "chartiers creek");

    //Associated Action Status
    cy.findAllByRole("checkbox", { name: "Historical" }).each(
      ($elem, index) => {
        index === 1 ? cy.wrap($elem).click({ force: true }) : "";
      }
    );

    //Associated Action Type
    cy.selectOption("input-associatedActionType", "planning");

    //CWA 303d Priority Ranking
    cy.findByRole("checkbox", { name: "High" }).click({ force: true });

    //Cycle Expected to Attain
    cy.get("#input-cycleExpectedToAttainLo").type("2018");
    cy.get("#input-cycleExpectedToAttainHi").type("2019");

    //Cycle First
    cy.get("#input-cycleFirstListedLo").type("2001");
    cy.get("#input-cycleFirstListedHi").type("2011");

    //Cycle Last Assessed
    cy.get("#input-cycleLastAssessedLo").type("2020");
    cy.get("#input-cycleLastAssessedHi").type("2022");

    //Cycle Scheduled for TMDL
    cy.get("#input-cycleScheduledForTmdlLo").type("2013");
    cy.get("#input-cycleScheduledForTmdlHi").type("2019");

    //Delisted
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 0 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Delisted Reason
    cy.selectOption("input-delistedReason", "wqs no longer");

    //EPA IR Category
    cy.selectOption("input-epaIrCategory", "5a");

    //Monitoring End Date
    cy.get("#input-monitoringEndDateLo").type("2016-06-03");
    cy.get("#input-monitoringEndDateHi").type("2020-07-16");

    //Monitoring Start Date
    cy.get("#input-monitoringStartDateLo").type("2013-08-08");
    cy.get("#input-monitoringStartDateHi").type("2021-06-23");

    //Organization ID
    cy.selectOption("input-organizationId", "21pa");

    //Organization Name
    cy.selectOption("input-organizationName", "connecticut");

    //Overall Status
    cy.selectOption("input-overallStatus", "not su");

    //Parameter Attainment
    cy.selectOption("input-parameterAttainment", "ARSENIC");

    //Parameter Group
    cy.selectOption("input-parameterGroup", "chlorine");

    //Parameter Name
    cy.selectOption("input-parameterName", "mcpa");

    //Parameter State IR Category
    cy.selectOption("input-parameterStateIrCategory", "mcpb");

    //Parameter Status
    cy.findByRole("checkbox", { name: "Cause" }).click({
      force: true,
    });

    //Pollutant Indicator
    cy.findAllByRole("checkbox", { name: "Yes" }).each(($elem, index) => {
      index === 1 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Region
    cy.selectOption("input-region", "07");

    //Reporting Cycle
    cy.get("#input-reportingCycleLo").type("2016");
    cy.get("#input-reportingCycleHi").type("2023");

    //Season End Date
    cy.get("#input-seasonEndDateLo").type("2011-04-23");
    cy.get("#input-seasonEndDateHi").type("2022-03-07");

    //Season Start Date
    cy.get("#input-seasonStartDateLo").type("2014-12-08");
    cy.get("#input-seasonStartDateHi").type("2022-02-02");

    //State
    cy.selectOption("input-state", "georgia");

    //State IR Category
    cy.selectOption("input-stateIrCategory", "4Ah");

    //Use Class Name
    cy.selectOption("input-useClassName", "fw1");

    //Use Group
    cy.selectOption("input-useGroup", "other");

    //Use Name
    cy.selectOption("input-useName", "drinking water");

    //Use State IR Category
    cy.selectOption("input-useStateIrCategory", "cfc-113");

    //Use Support
    cy.findAllByRole("checkbox", { name: "No" }).each(($elem, index) => {
      index === 2 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Vision 303d Priority
    cy.findAllByRole("checkbox", { name: "No" }).each(($elem, index) => {
      index === 3 ? cy.wrap($elem).click({ force: true }) : "";
    });

    //Water Type
    cy.selectOption("input-waterType", "inlet");

    //File Format
    cy.findByText("JavaScript Object Notation (JSON)").click();

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{"alternateListingIdentifier":["77914"],"assessmentBasis":["Extrapolated Data"],"assessmentMethods":["Ecological/habitat surveys"],"assessmentTypes":["OTHER"],"assessmentUnitId":["DCTOR01R_00"],"assessmentUnitName":["JONES BROOK"],"assessmentUnitStatus":["H"],"associatedActionAgency":["T"],"associatedActionId":["1027"],"associatedActionName":["Chartiers Creek"],"associatedActionStatus":["H"],"associatedActionType":["4B Restoration Approach"],"cwa303dPriorityRanking":["High"],"delisted":["Y"],"delistedReason":["DELISTING_WQS_NOT_APPLICABLE"],"epaIrCategory":["5A"],"organizationId":["21PA"],"organizationName":["Connecticut"],"overallStatus":["Not Supporting"],"parameterAttainment":["ARSENIC"],"parameterGroup":["CHLORINE"],"parameterName":["MCPA"],"parameterStateIrCategory":["MCPB"],"parameterStatus":["Cause"],"pollutantIndicator":["Y"],"region":["07"],"state":["GA"],"stateIrCategory":["4Ah"],"useClassName":["FW1"],"useGroup":["OTHER"],"useName":["Drinking Water"],"useStateIrCategory":["CFC-113"],"useSupport":["N"],"vision303dPriority":["N"],"waterType":["INLET"],"assessmentDateLo":"08-09-2017","assessmentDateHi":"02-14-2022","monitoringEndDateLo":"06-03-2016","monitoringEndDateHi":"07-16-2020","monitoringStartDateLo":"08-08-2013","monitoringStartDateHi":"06-23-2021","seasonEndDateLo":"04-23-2011","seasonEndDateHi":"03-07-2022","seasonStartDateLo":"12-08-2014","seasonStartDateHi":"02-02-2022","cycleExpectedToAttainLo":"2018","cycleExpectedToAttainHi":"2019","cycleFirstListedLo":"2001","cycleFirstListedHi":"2011","cycleLastAssessedLo":"2020","cycleLastAssessedHi":"2022","cycleScheduledForTmdlLo":"2013","cycleScheduledForTmdlHi":"2019","reportingCycleLo":"2016","reportingCycleHi":"2023"},"options":{"format":"json"}}'
          )} ${origin}/attains/data/assessments`
        );
      });
  });
});
