import { NavLink } from 'react-router-dom';
// components
import { InPageNavLayout } from 'components/inPageNav';
// config
import { serverUrl } from 'config';
// types
import type { ReactNode } from 'react';

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

  return (
    <div className="l-page has-footer">
      <div className="l-constrain">
        <div className="l-page__header">
          <div className="l-page__header-first usa-logo margin-top-0">
            <div className="web-area-title usa-logo__text">
              <NavLink to="/">Expert Query</NavLink>
            </div>
          </div>
          <div className="l-page__header-last grid-row">
            <a
              className="margin-left-2 tablet:margin-left-0 margin-right-3 text-no-underline tablet:grid-col-auto"
              href={`${serverUrl}/national-downloads`}
              target="_blank"
              rel="noopener noreferrer"
            >
              National Downloads
            </a>
            <a
              className="margin-left-2 tablet:margin-left-0 margin-right-3 text-no-underline tablet:grid-col-auto"
              href={`${baseUrl}/api/getFile/path/Expert-Query-Users-Guide.pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              User's Guide (PDF)
            </a>
            <a
              className="margin-left-2 tablet:margin-left-0 margin-right-3 text-no-underline tablet:grid-col-auto"
              href="https://www.epa.gov/waterdata/forms/contact-us-about-water-data-and-tools"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>

      <InPageNavLayout>
        <article className="article">{children}</article>
      </InPageNavLayout>

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
