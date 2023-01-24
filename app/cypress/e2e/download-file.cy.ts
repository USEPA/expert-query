describe("Download file", () => {
  before(() => {
    cy.visit("/");
  });

  let count = "0";
  it("Download and Verify Alert message visible when download and hidden after 10 second", () => {
    cy.selectProfile("Assessments");
    cy.get("#input-state").type("texas{downArrow}{enter}");
    cy.findByText("JavaScript Object Notation (JSON)").click();
    cy.findByRole("button", { name: "Download" }).click();
    cy.wait(2000);
    cy.findByText("Continue").should("exist");
    cy.findByTestId("downloadfile-length").then(($el) => {
      count = $el.text();
    });
    cy.findByText("Continue").click();
    cy.findByText("Query executed successfully.").should("exist");
    cy.wait(10000);
    cy.findByText("Query executed successfully.").should("not.exist");
  });

  it("Read and Validate assessement.json file", () => {
    const path = "cypress/downloads/assessments.json";
    cy.readFile(path, { timeout: 25000 }).should("exist");
    cy.readFile(path).should("be.a", "array");
    cy.readFile(path).should("have.length.at.least", 1);
    cy.readFile(path).should("have.length", count);
    cy.readFile(path).then((item) => {
      const firstElement = item[0];
      const property = [
        "id",
        "alternateListingIdentifier",
        "assessmentBasis",
        "assessmentDate",
        "assessmentMethods",
        "assessmentTypes",
        "assessmentUnitId",
        "assessmentUnitName",
        "assessmentUnitStatus",
        "associatedActionAgency",
        "associatedActionId",
        "associatedActionName",
        "associatedActionStatus",
        "associatedActionType",
        "consentDecreeCycle",
        "cwa303dPriorityRanking",
        "cycleExpectedToAttain",
        "cycleFirstListed",
        "cycleLastAssessed",
        "cycleScheduledForTmdl",
        "delisted",
        "delistedReason",
        "epaIrCategory",
        "locationDescription",
        "monitoringEndDate",
        "monitoringStartDate",
        "organizationId",
        "organizationName",
        "organizationType",
        "overallStatus",
        "parameterAttainment",
        "parameterGroup",
        "parameterIrCategory",
        "parameterName",
        "parameterStateIrCategory",
        "parameterStatus",
        "pollutantIndicator",
        "region",
        "reportingCycle",
        "seasonEndDate",
        "seasonStartDate",
        "sizeSource",
        "sourceScale",
        "state",
        "stateIrCategory",
        "useClassName",
        "useGroup",
        "useIrCategory",
        "useName",
        "useStateIrCategory",
        "useSupport",
        "vision303dPriority",
        "waterSize",
        "waterSizeUnits",
        "waterType",
      ];
      // Validate All propertys are available
      property.forEach((item) => {
        expect(firstElement).to.have.property(item);
      });
      // Downloaded assessements.jsom filtered with state Texas
      expect(firstElement.state).to.eq("TX");
    });
  });
});
