import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
/*
  NOTE: regenerator-runtime is imported to avoid a bug with a GitHub Action
  workflow including regenerator-runtime in the build as an external dependency.
  For reference, the GitHub Action workflow's log message stated:
    "regenerator-runtime/runtime.js" is imported by
    "regenerator-runtime/runtime.js?commonjs-external", but could not be
    resolved – treating it as an external dependency.
*/
import 'regenerator-runtime';
// ---
import { ContentProvider } from 'contexts/content';
import { ErrorBoundary } from 'components/errorBoundary';
import { App } from 'components/app';

const container = document.getElementById('root') as HTMLElement;

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <ContentProvider>
        <App />
      </ContentProvider>
    </ErrorBoundary>
  </StrictMode>,
);
