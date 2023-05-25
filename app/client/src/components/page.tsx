import { NavLink, useLocation } from 'react-router-dom';
// components
import { ReactComponent as Folder } from 'images/folder.svg';
import { ReactComponent as Info } from 'images/info.svg';
import { ReactComponent as Contact } from 'images/mail.svg';
import { InPageNavLayout } from 'components/inPageNav';
// config
import { serverUrl } from 'config';
// types
import type { FunctionComponent, ReactNode, SVGProps } from 'react';

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
        className="position-relative height-card desktop:height-card-lg"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.775) 25%, rgba(0, 0, 0, 0.525) 50%, rgba(0, 0, 0, 0.275) 75%), url(/img/banner.jpg)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="l-constrain l-page__header display-flex flex-column height-full">
          <div className="margin-top-2 flex-align-self-center tablet:flex-align-self-end">
            <HeaderLink
              className="margin-right-3"
              icon={Folder}
              href={`${serverUrl}/national-downloads`}
            >
              National Downloads
            </HeaderLink>
            <HeaderLink
              className="margin-right-3"
              icon={Info}
              href={`${baseUrl}/api/getFile/path/Expert-Query-Users-Guide.pdf`}
            >
              User's Guide (PDF)
            </HeaderLink>
            <HeaderLink
              icon={Contact}
              href="https://www.epa.gov/waterdata/forms/contact-us-about-water-data-and-tools"
            >
              Contact Us
            </HeaderLink>
          </div>
          <div className="display-flex flex-fill flex-justify-center">
            <div className="flex-align-self-center flex-auto usa-logo margin-0 ">
              {location.pathname.includes('/api-documentation') ? (
                <h1 className="web-area-title font-heading-xl tablet:font-heading-2xl usa-logo__text">
                  <NavLink to="/">Expert Query</NavLink>
                </h1>
              ) : (
                <div className="web-area-title font-heading-xl tablet:font-heading-2xl usa-logo__text">
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

type HeaderLinkProps = {
  children: string;
  className?: string;
  icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  href: string;
};

function HeaderLink({ className, children, icon, href }: HeaderLinkProps) {
  const Icon = icon;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`display-inline-flex flex-align-center font-ui-xs text-no-underline hover:text-underline ${className}`}
    >
      <Icon
        aria-hidden="true"
        className="height-205 tablet:height-2 tablet:margin-right-1 usa-icon width-205 tablet:width-2"
        focusable="false"
        role="img"
      />
      <span className="mobile-sr-only">{children}</span>
    </a>
  );
}
