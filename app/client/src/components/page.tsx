import { NavLink, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const baseUrl =
    location.hostname === 'localhost'
      ? `${location.protocol}//${location.hostname}:9090`
      : serverUrl;

  return (
    <div className="l-page has-footer desktop:padding-top-0">
      <div
        className="position-relative height-15 tablet:height-card"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.875) 25%, rgba(0, 0, 0, 0.625) 50%, rgba(0, 0, 0, 0.375) 75%), url(/img/banner.jpg)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="l-constrain l-page__header display-flex flex-column height-full">
          <div className="margin-top-1 flex-align-self-center tablet:flex-align-self-end">
            <a
              className="margin-right-3 text-no-underline hover:text-underline"
              href={`${serverUrl}/national-downloads`}
              target="_blank"
              rel="noopener noreferrer"
            >
              National Downloads
            </a>
            <a
              className="margin-right-3 text-no-underline hover:text-underline"
              href={`${baseUrl}/api/getFile/path/Expert-Query-Users-Guide.pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              User's Guide (PDF)
            </a>
            <a
              className="tablet:margin-right-3 text-no-underline hover:text-underline"
              href="https://www.epa.gov/waterdata/forms/contact-us-about-water-data-and-tools"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Us
            </a>
          </div>
          <div className="display-flex flex-fill flex-justify-center">
            <div className="flex-align-self-center flex-auto usa-logo margin-0 ">
              {location.pathname.includes('/api-documentation') ? (
                <h1 className="web-area-title usa-logo__text">
                  <NavLink to="/">Expert Query</NavLink>
                </h1>
              ) : (
                <div className="web-area-title usa-logo__text">
                  <NavLink to="/">Expert Query</NavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="l-constrain">
        <InPageNavLayout>
          <article className="article">{children}</article>
        </InPageNavLayout>
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
