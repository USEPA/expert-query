import type { ReactNode } from 'react';

export default Page;

type PageProps = {
  children: ReactNode;
};

export function Page({ children }: PageProps) {
  return (
    <div className="l-page has-footer">
      <div className="l-constrain">
        <div className="l-page__header">
          <div className="l-page__header-first">
            <h1 className="web-area-title">Expert Query</h1>
          </div>
          <div className="l-page__header-last">
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

        <div className="l-sidebar">
          <div className="l-sidebar__sidebar margin-left-0 margin-right-5">
            <nav aria-label="Side navigation,">
              <ul className="usa-sidenav">
                <li className="usa-sidenav__item">
                  <a href="/" className="usa-current">
                    Home
                  </a>
                </li>
                <li className="usa-sidenav__item">
                  <a href="/national-downloads">National Downloads</a>
                </li>
                <li className="usa-sidenav__item">
                  <a href="/api-documentation">API Documentation</a>
                </li>
              </ul>
            </nav>
          </div>
          <div className="l-sidebar__main">
            <article className="article">{children}</article>
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
