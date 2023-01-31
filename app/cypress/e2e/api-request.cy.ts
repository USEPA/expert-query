describe("Api Validations", () => {
  const location = window.location;
  const origin =
    location.hostname === "localhost"
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it("Verify data profile item's count POST api", () => {
    const url = `${origin}/attains/data/sources/count`;
    const body = { filters: { confirmed: ["Y"] }, options: { format: "tsv" } };

    cy.request("POST", url, body).then(async ({ body, status }) => {
      expect(status).to.eq(200);
      expect(body).to.have.property("count");
    });
  });

  it("Verify data profile item's count GET api", () => {
    const url = `${origin}/attains/data/sources/count?confirmed=Y&format=tsw`;

    cy.request("GET", url).then(async ({ body, status }) => {
      expect(status).to.eq(200);
      expect(body).to.have.property("count");
    });
  });

  it("Verify sources downloading POST api", () => {
    const url = `${origin}/attains/data/sources`;
    const body = {
      filters: { confirmed: ["Y"], parameterGroup: ["OTHER CAUSE"] },
      options: { format: "tsv" },
    };

    cy.request("POST", url, body).then(async ({ status }) => {
      expect(status).to.eq(200);
    });
  });

  it("Verify sources downloading GET api", () => {
    const url = `${origin}/attains/data/sources?confirmed=Y&format=tsw&parameterGroup=OTHER CAUSE`;

    cy.request("GET", url).then(async ({ body, status }) => {
      expect(status).to.eq(200);
      expect(body).to.be.a("array");
    });
  });

  it("Verify lookupFiles GET api", () => {
    const url = `${origin}/api/lookupFiles`;

    cy.request("GET", url).then(async ({ body, status }) => {
      expect(status).to.eq(200);
      expect(body).to.have.property("alertsConfig");
      expect(body).to.have.property("domainValues");
      expect(body).to.have.property("glossary");
      expect(body).to.have.property("services");
    });
  });

  it("lookupFiles POST api 404", () => {
    const url = `${origin}/api/lookupFiles`;

    cy.request({ method: "POST", url, failOnStatusCode: false }).then(
      async ({ status }) => {
        expect(status).to.eq(404);
      }
    );
  });

  it("Action's GET APIs", () => {
    const fieldNames = [
      "assessmentUnitId",
      "actionId",
      "assessmentUnitName",
      "actionName",
      "organizationName",
      "region",
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/actions/values/${fieldNames[i]}?text=&limit=20`;

      cy.request("GET", url).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a("array");
      });
    }
  });

  it("Assessment Unit's GET APIs", () => {
    const fieldNames = [
      "assessmentUnitId",
      "assessmentUnitName",
      "locationText",
      "organizationName",
      "region",
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/assessmentUnits/values/${fieldNames[i]}?text=&limit=20`;

      cy.request("GET", url).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a("array");
      });
    }
  });

  it("Assessments's GET APIs", () => {
    const fieldNames = [
      "alternateListingIdentifier",
      "assessmentBasis",
      "assessmentMethods",
      "assessmentUnitId",
      "assessmentUnitName",
      "associatedActionId",
      "associatedActionName",
      "epaIrCategory",
      "organizationName",
      "overallStatus",
      "parameterAttainment",
      "parameterIrCategory",
      "region",
      "useGroup",
      "useIrCategory",
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/assessments/values/${fieldNames[i]}?text=&limit=20`;

      cy.request("GET", url).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a("array");
      });
    }
  });

  it("Assessment Units with Monitoring Locations's GET APIs", () => {
    const fieldNames = [
      "assessmentUnitId",
      "assessmentUnitName",
      "monitoringLocationId",
      "monitoringLocationOrgId",
      "organizationName",
      "region",
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/assessmentUnitsMonitoringLocations/values/${fieldNames[i]}?text=&limit=20`;

      cy.request("GET", url).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a("array");
      });
    }
  });

  it("Catchment Correspondence's GET APIs", () => {
    const fieldNames = [
      "assessmentUnitId",
      "assessmentUnitName",
      "organizationName",
      "region",
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/catchmentCorrespondence/values/${fieldNames[i]}?text=&limit=20`;

      cy.request("GET", url).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a("array");
      });
    }
  });

  it("Sources's GET APIs", () => {
    const fieldNames = [
      "assessmentUnitId",
      "assessmentUnitName",
      "causeName",
      "epaIrCategory",
      "organizationName",
      "overallStatus",
      "region",
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/sources/values/${fieldNames[i]}?text=&limit=20`;

      cy.request("GET", url).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a("array");
      });
    }
  });

  it("Total Maximum Daily Load's GET APIs", () => {
    const fieldNames = [
      "actionId",
      "actionName",
      "addressedParameter",
      "assessmentUnitId",
      "assessmentUnitName",
      "explicitMarginOfSafety",
      "implicitMarginOfSafety",
      "npdesIdentifier",
      "organizationName",
      "otherIdentifier",
      "region",
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/tmdl/values/${fieldNames[i]}?text=&limit=20`;

      cy.request("GET", url).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a("array");
      });
    }
  });

  it("Verify error message while using wrong Profile name GET api", () => {
    const url = `${origin}/api/wrongProfile/values/fieldName`;
    const message = "The requested profile does not exist";

    cy.request({ method: "GET", url, failOnStatusCode: false }).then(
      async ({ body, status }) => {
        expect(status).to.eq(404);
        expect(body.message).to.eq(message);
      }
    );
  });

  it("Verify error message while using correct Profile name and wrong fieldName name GET api", () => {
    const url = `${origin}/api/actions/values/wrongFieldName`;
    const message =
      "The requested column does not exist on the selected profile";

    cy.request({ method: "GET", url, failOnStatusCode: false }).then(
      async ({ body, status }) => {
        expect(status).to.eq(404);
        expect(body.message).to.eq(message);
      }
    );
  });
});
