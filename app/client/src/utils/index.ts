export * from './hooks';

export function isAbort(error: unknown) {
  if (!error || typeof error !== 'object' || !('name' in error)) return false;
  return (error as Error).name === 'AbortError';
}
