export * as fields from './fields';
export * as options from './options';
export { profiles } from './profiles';

const { NODE_ENV, REACT_APP_CLOUD_SPACE, REACT_APP_SERVER_BASE_PATH } =
  process.env;

// allows the app to be accessed from a sub directory of a server (e.g. /expertquery)
export const serverBasePath =
  NODE_ENV === 'local' ? '' : REACT_APP_SERVER_BASE_PATH || '';

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

export const cloudSpace =
  NODE_ENV === 'development' ? 'dev' : REACT_APP_CLOUD_SPACE || '';

async function fetchData(
  url: string,
  options: RequestInit,
  responseType: 'json' | 'blob' = 'json',
) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(response.statusText);
    const contentType = response.headers.get('content-type');
    if (responseType === 'json') {
      return contentType?.includes('application/json')
        ? await response.json()
        : Promise.reject(new Error('Invalid content type received'));
    } else {
      return await response.blob();
    }
  } catch (error) {
    return await Promise.reject(error);
  }
}

/**
 * Fetches data and returns a promise containing JSON fetched from a provided
 * web service URL or handles any other OK response returned from the server
 */
export function getData<T>({
  url,
  apiKey,
  signal,
}: {
  url: string;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<T> {
  const headers: HeadersInit = {};
  if (apiKey) headers['X-Api-Key'] = apiKey;

  return fetchData(url, {
    method: 'GET',
    headers,
    signal,
  });
}

/**
 * Posts JSON data and returns a promise containing JSON fetched from a provided
 * web service URL or handles any other OK response returned from the server
 */
export function postData({
  url,
  apiKey,
  data,
  responseType,
  signal,
}: {
  url: string;
  apiKey: string;
  data: object;
  responseType?: 'json' | 'blob';
  signal?: AbortSignal;
}) {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (apiKey) headers['X-Api-Key'] = apiKey;

  return fetchData(
    url,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal,
    },
    responseType,
  );
}
