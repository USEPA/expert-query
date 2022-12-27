import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import 'uswds/css/uswds.css';
import 'bootstrap/dist/css/bootstrap-grid.min.css';
// components
import { Home } from 'routes/home';
import ErrorPage from 'routes/404';
import { MarkdownContent } from 'components/markdownContent';
// contexts
import { useContentState, useContentDispatch } from 'contexts/content';
// config
import { cloudSpace, getData, serverUrl } from '../config';
// types
import type { Content } from 'contexts/content';

/** Custom hook to fetch static content */
function useFetchedContent() {
  const contentDispatch = useContentDispatch();

  useEffect(() => {
    const controller = new AbortController();

    contentDispatch({ type: 'FETCH_CONTENT_REQUEST' });
    getData<Content>(`${serverUrl}/api/lookupFiles`, controller.signal)
      .then((res) => {
        contentDispatch({
          type: 'FETCH_CONTENT_SUCCESS',
          payload: res,
        });
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        contentDispatch({ type: 'FETCH_CONTENT_FAILURE' });
      });

    return function cleanup() {
      controller.abort();
    };
  }, [contentDispatch]);
}

/** Custom hook to display a site-wide alert banner */
function useSiteAlertBanner() {
  const { content } = useContentState();

  useEffect(() => {
    if (content.status !== 'success') return;
    if (!content.data?.alertsConfig?.siteLevel?.content) return;

    const siteAlert = document.querySelector('.usa-site-alert');
    if (!siteAlert) return;

    siteAlert.setAttribute('aria-label', 'Site alert');
    siteAlert.classList.add(
      content.data?.alertsConfig?.siteLevel?.class ??
        'usa-site-alert--emergency',
    );

    const siteAlertRoot = createRoot(siteAlert);
    siteAlertRoot.render(
      <div className="usa-alert">
        <MarkdownContent
          className="usa-alert__body"
          children={content.data?.alertsConfig?.siteLevel?.content || ''}
          components={{
            h1: (props) => (
              <h3 className="usa-alert__heading">{props.children}</h3>
            ),
            h2: (props) => (
              <h3 className="usa-alert__heading">{props.children}</h3>
            ),
            h3: (props) => (
              <h3 className="usa-alert__heading">{props.children}</h3>
            ),
            p: (props) => <p className="usa-alert__text">{props.children}</p>,
          }}
        />
      </div>,
    );
  }, [content]);
}

/** Custom hook to display the Expert Query disclaimer banner for development/staging */
function useDisclaimerBanner() {
  useEffect(() => {
    if (!(cloudSpace === 'dev' || cloudSpace === 'staging')) return;

    const siteAlert = document.querySelector('.usa-site-alert');
    if (!siteAlert) return;

    const banner = document.createElement('div');
    banner.setAttribute('id', 'eq-disclaimer-banner');
    banner.setAttribute(
      'class',
      'padding-1 text-center text-white bg-secondary-dark',
    );
    banner.innerHTML = `<strong>EPA development environment:</strong> The
      content on this page is not production data and this site is being used
      for <strong>development</strong> and/or <strong>testing</strong> purposes
      only.`;

    siteAlert.insertAdjacentElement('beforebegin', banner);

    return function cleanup() {
      banner.remove();
    };
  }, []);
}

export function App() {
  useFetchedContent();
  useDisclaimerBanner();
  useSiteAlertBanner();

  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Navigate to="/attains" replace />} />
        <Route path="/attains" element={<Home />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
