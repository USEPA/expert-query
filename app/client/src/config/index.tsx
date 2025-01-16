const { MODE, VITE_CLOUD_SPACE, VITE_SERVER_BASE_PATH } = import.meta.env;

// allows the app to be accessed from a sub directory of a server (e.g. /expertquery)
export const serverBasePath =
  MODE === 'development' ? '' : VITE_SERVER_BASE_PATH || '';

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
const loc = window.location;

export const clientUrl = loc.origin + serverBasePath;

export const serverUrl =
  MODE === 'development'
    ? `${loc.protocol}//${loc.hostname}:3002${serverBasePath}`
    : clientUrl;

export const cloudSpace =
  MODE === 'development' ? 'dev' : VITE_CLOUD_SPACE || '';
