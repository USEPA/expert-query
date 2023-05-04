import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
// config
import { serverBasePath, serverUrl } from 'config';

export default Page;

type PageProps = {
  children: ReactNode;
};

export function Page({ children }: PageProps) {
  const location = window.location;
  const baseUrl =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:9090`
      : serverUrl;

  const navItems = {
    attains: { path: '/attains', label: 'Query ATTAINS Data' },
    nationalDownloads: {
      path: '/national-downloads',
      label: 'National Downloads',
    },
    apiDocs: { path: '/api-documentation', label: 'API Documentation' },
  };

  return (
    <div className="l-page has-footer">
      <div className="l-constrain maxw-widescreen">
        <div className="l-page__header">
          <div className="l-page__header-first usa-logo">
            <h1 className="web-area-title usa-logo__text">
              <NavLink to="/">Expert Query</NavLink>
            </h1>
          </div>
          <div className="l-page__header-last">
            <a
              className="header-link margin-right-3"
              href={`${baseUrl}/api/getFile/path/Expert-Query-Users-Guide.pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              User's Guide (PDF)
            </a>
            <a
              className="header-link"
              href="https://www.epa.gov/expertquery/forms/contact-us-about-expert-query"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Us
            </a>
          </div>
        </div>

        <div className="l-sidebar l-sidebar--reversed">
          <div className="l-sidebar__main">
            <article className="article">{children}</article>
          </div>
          <div className="l-sidebar__sidebar">
            <nav aria-label="Side navigation,">
              <ul className="usa-sidenav">
                {Object.entries(navItems).map(([key, item]) => (
                  <li key={key} className="usa-sidenav__item">
                    <NavLink
                      to={serverBasePath + item.path}
                      className={({ isActive }) =>
                        isActive ? 'usa-current' : ''
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <div className="l-page__footer">
        <div className="l-constrain">
          <span>
            <a
              href="https://www.epa.gov/expertquery/forms/contact-us-about-expert-query"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Us
            </a>
            &nbsp;to ask a question, provide feedback, or report a problem.
          </span>

          <span>&nbsp;</span>
        </div>
      </div>
    </div>
  );
}
