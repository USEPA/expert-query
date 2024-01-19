import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
