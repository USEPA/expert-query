export * from './hooks';

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

export function isAbort(error: unknown) {
  if (!error || typeof error !== 'object' || !('name' in error)) return false;
  return (error as Error).name === 'AbortError';
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
