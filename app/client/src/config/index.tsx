export * as fields from './fields';
export * as options from './options';
export { default as profiles } from './profiles';

const { NODE_ENV, REACT_APP_CLOUD_SPACE } = process.env;

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
export const serverUrl = window.location.origin;

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
export function getData<T>(url: string, signal?: AbortSignal): Promise<T> {
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
export function postData(
  url: string,
  data: object,
  responseType?: 'json' | 'blob',
) {
  return fetchData(
    url,
    {
      method: 'POST',
      credentials: 'include' as const,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    responseType,
  );
}
