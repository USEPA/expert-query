describe('Api Validations', () => {
  const location = window.location;
  const origin =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  it("Verify data profile item's count POST api", () => {
    const url = `${origin}/api/attains/sources/count`;
    const body = { filters: { confirmed: ['Y'] }, options: { format: 'tsv' } };

    cy.request('POST', url, body).then(async ({ body, status }) => {
      expect(status).to.eq(200);
      expect(body).to.have.property('count');
    });
  });

  it("Verify data profile item's count GET api", () => {
    const url = `${origin}/api/attains/sources/count?confirmed=Y&format=tsv`;

    cy.request('GET', url).then(async ({ body, status }) => {
      expect(status).to.eq(200);
      expect(body).to.have.property('count');
    });
  });

  it('Verify sources downloading POST api', () => {
    const url = `${origin}/api/attains/sources`;
    const body = {
      filters: { confirmed: ['Y'], parameterGroup: ['OTHER CAUSE'] },
      options: { format: 'tsv' },
    };

    cy.request('POST', url, body).then(async ({ status }) => {
      expect(status).to.eq(200);
    });
  });

  it('Verify sources downloading GET api', () => {
    const url = `${origin}/api/attains/sources?confirmed=Y&parameterGroup=OTHER CAUSE`;

    cy.request('GET', url).then(async ({ body, status }) => {
      expect(status).to.eq(200);
      expect(body.data).to.be.a('array');
    });
  });

  it('Verify lookupFiles GET api', () => {
    const url = `${origin}/api/lookupFiles`;

    cy.request('GET', url).then(async ({ body, status }) => {
      expect(status).to.eq(200);
      expect(body).to.have.property('alertsConfig');
      expect(body).to.have.property('domainValues');
      expect(body).to.have.property('glossary');
      expect(body).to.have.property('services');
    });
  });

  it('lookupFiles POST api 404', () => {
    const url = `${origin}/api/lookupFiles`;

    cy.request({ method: 'POST', url, failOnStatusCode: false }).then(
      async ({ status }) => {
        expect(status).to.eq(404);
      },
    );
  });

  it("Action's POST APIs", () => {
    const fieldNames = [
      'assessmentUnitId',
      'actionId',
      'assessmentUnitName',
      'actionName',
      'organizationName',
      'region',
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/attains/actions/values/${fieldNames[i]}`;
      const body = { text: '', limit: 20 };

      cy.request('POST', url, body).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a('array');
      });
    }
  });

  it("Assessment Unit's POST APIs", () => {
    const fieldNames = [
      'assessmentUnitId',
      'assessmentUnitName',
      'locationText',
      'organizationName',
      'region',
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/attains/assessmentUnits/values/${fieldNames[i]}`;
      const body = { text: '', limit: 20 };

      cy.request('POST', url, body).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a('array');
      });
    }
  });

  it("Assessments's POST APIs", () => {
    const fieldNames = [
      'alternateListingIdentifier',
      'assessmentBasis',
      'assessmentMethods',
      'assessmentUnitId',
      'assessmentUnitName',
      'associatedActionId',
      'associatedActionName',
      'epaIrCategory',
      'organizationName',
      'overallStatus',
      'parameterAttainment',
      'parameterIrCategory',
      'region',
      'useGroup',
      'useIrCategory',
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/attains/assessments/values/${fieldNames[i]}`;
      const body = { text: '', limit: 20 };

      cy.request('POST', url, body).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a('array');
      });
    }
  });

  it("Assessment Units with Monitoring Locations's POST APIs", () => {
    const fieldNames = [
      'assessmentUnitId',
      'assessmentUnitName',
      'monitoringLocationId',
      'monitoringLocationOrgId',
      'organizationName',
      'region',
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/attains/assessmentUnitsMonitoringLocations/values/${fieldNames[i]}`;
      const body = { text: '', limit: 20 };

      cy.request('POST', url, body).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a('array');
      });
    }
  });

  it("Catchment Correspondence's POST APIs", () => {
    const fieldNames = [
      'assessmentUnitId',
      'assessmentUnitName',
      'organizationName',
      'region',
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/attains/catchmentCorrespondence/values/${fieldNames[i]}`;
      const body = { text: '', limit: 20 };

      cy.request('POST', url, body).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a('array');
      });
    }
  });

  it("Sources's POST APIs", () => {
    const fieldNames = [
      'assessmentUnitId',
      'assessmentUnitName',
      'causeName',
      'epaIrCategory',
      'organizationName',
      'overallStatus',
      'region',
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/attains/sources/values/${fieldNames[i]}`;
      const body = { text: '', limit: 20 };

      cy.request('POST', url, body).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a('array');
      });
    }
  });

  it("Total Maximum Daily Load's POST APIs", () => {
    const fieldNames = [
      'actionId',
      'actionName',
      'addressedParameter',
      'assessmentUnitId',
      'assessmentUnitName',
      'explicitMarginOfSafety',
      'implicitMarginOfSafety',
      'npdesIdentifier',
      'organizationName',
      'otherIdentifier',
      'region',
    ];

    for (let i = 0; i < fieldNames.length; i++) {
      const url = `${origin}/api/attains/tmdl/values/${fieldNames[i]}`;
      const body = { text: '', limit: 20 };

      cy.request('POST', url, body).then(async ({ body, status }) => {
        expect(status).to.eq(200);
        expect(body).to.be.a('array');
      });
    }
  });

  it('Verify error message while using wrong Profile name POST api', () => {
    const url = `${origin}/api/attains/wrongProfile/values/fieldName`;
    const message = 'The requested profile does not exist';

    cy.request({ method: 'POST', url, failOnStatusCode: false }).then(
      async ({ body, status }) => {
        expect(status).to.eq(404);
        expect(body.message).to.eq(message);
      },
    );
  });

  it('Verify error message while using correct Profile name and wrong fieldName name POST api', () => {
    const url = `${origin}/api/attains/actions/values/wrongFieldName`;
    const body = { text: 'ver' };
    const message =
      'The column wrongFieldName does not exist on the selected profile';

    cy.request({ method: 'POST', url, body, failOnStatusCode: false }).then(
      async ({ body, status }) => {
        expect(status).to.eq(400);
        expect(body.message).to.eq(message);
      },
    );
  });
});
