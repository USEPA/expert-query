export * as options from './options';

const { NODE_ENV, REACT_APP_CLOUD_SPACE, REACT_APP_SERVER_BASE_PATH } =
  process.env;

// allows the app to be accessed from a sub directory of a server (e.g. /attains-query)
export const serverBasePath =
  NODE_ENV === 'development' ? '' : REACT_APP_SERVER_BASE_PATH || '';

// NOTE: This app is configured to use [Create React App's proxy setup]
// (https://create-react-app.dev/docs/proxying-api-requests-in-development/)
//
// For local development, the React app development server runs on port 3000,
// and the Express app server runs on port 3001, so we've added a proxy field to
// the client app's package.json file to proxy unknown requests from the React
// app to the Express app (for local dev only – only works with `npm start`).
//
// When deployed to Cloud.gov, the React app is built and served as static files
// from the Express app, so it's one app running from a single port so no proxy
// is needed for production.
export const serverUrl = window.location.origin + serverBasePath;

// NOTE: Create React App's local development proxy setup doesn't proxy requests
// that set an "Accept" request header to "text/html", so in those cases we need
// to explicitly use the server app's URL/port (localhost:3001)
export const serverUrlForHrefs =
  NODE_ENV === 'development' ? 'http://localhost:9090' : serverUrl;

export const cloudSpace =
  NODE_ENV === 'development' ? 'dev' : REACT_APP_CLOUD_SPACE || '';

async function fetchData(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(response.statusText);
    const contentType = response.headers.get('content-type');
    return contentType?.includes('application/json')
      ? await response.json()
      : Promise.reject(new Error('Invalid content type received'));
  } catch (error) {
    return await Promise.reject(error);
  }
}

/**
 * Fetches data and returns a promise containing JSON fetched from a provided
 * web service URL or handles any other OK response returned from the server
 */
export function getData<T>(url: string, signal: AbortSignal): Promise<T> {
  return fetchData(url, {
    method: 'GET',
    credentials: 'include' as const,
    signal,
  });
}

/**
 * Posts JSON data and returns a promise containing JSON fetched from a provided
 * web service URL or handles any other OK response returned from the server
 */
export function postData(url: string, data: object) {
  return fetchData(url, {
    method: 'POST',
    credentials: 'include' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export const dataProfiles = {
  assessmentUnits: {
    description: 'Description of assessment units',
    fields: [
      'assessmentUnitId',
      'assessmentUnitName',
      'assessmentUnitStatus',
      'locationDescription',
      'locationText',
      'locationTypeCode',
      'organizationId',
      'organizationName',
      'organizationType',
      'region',
      'sizeSource',
      'sourceScale',
      'state',
      'useClassName',
      'waterSize',
      'waterSizeUnits',
      'waterType',
    ],
    label: 'Assessment Units',
    resource: 'assessment-units',
  },
  assessmentUnitsMonitoring: {
    description: 'Description of assessment units with monitoring locations',
    fields: [
      'assessmentUnitId',
      'assessmentUnitName',
      'assessmentUnitStatus',
      'locationDescription',
      'monitoringLocationDataLink',
      'monitoringLocationId',
      'monitoringLocationOrgId',
      'organizationId',
      'organizationName',
      'organizationType',
      'region',
      'reportingCycle',
      'sizeSource',
      'sourceScale',
      'state',
      'useClassName',
      'waterSize',
      'waterSizeUnits',
      'waterType',
    ],
    label: 'Assessment Units with Monitoring Locations',
    resource: 'assessment-units-monitoring-locations',
  },
  catchmentCorrespondence: {
    description: 'Description of Catchment Correspondence',
    fields: [
      'assessmentUnitId',
      'assessmentUnitName',
      'catchmentNhdplusId',
      'organizationId',
      'organizationName',
      'organizationType',
      'region',
      'reportingCycle',
      'state',
    ],
    label: 'Catchment Correspondence',
    resource: 'catchment-correspondence',
  },
  sources: {
    description: 'Description of Sources',
    fields: ['state'],
    label: 'Sources',
    resource: 'sources',
  },
  tmdl: {
    description: 'Description of Total Maximum Daily Load',
    fields: ['state'],
    label: 'Total Maximum Daily Load',
    resource: 'tmdl',
  },
} as const;
