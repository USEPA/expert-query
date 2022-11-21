import Glossary from 'glossary-panel';
import { useEffect, useState } from 'react';
import { ReactComponent as Book } from 'uswds/img/usa-icons/local_library.svg';
// components
import Alert from 'components/alert';
// contexts
import { useContentState } from 'contexts/content';
// types
import type { ReactNode } from 'react';

function termsInDOM() {
  const items = document.getElementsByClassName('glossary__item');
  return items && items.length > 0;
}

type Props = {
  path: string;
};

export default function GlossaryPanel({ path }: Props) {
  const { content } = useContentState();
  const [glossary, setGlossary] = useState<Glossary | null>(null);

  useEffect(() => {
    if (content.status !== 'success') return;
    if (glossary) return;

    try {
      setGlossary(
        new Glossary(
          content.data.glossary.map((item) => {
            return { term: item.term, definition: item.definitionHtml };
          }),
        ),
      );
    } catch (err) {
      console.error(err);
    }
  }, [content, glossary]);

  // Set glossary to null to re-initialize the Glossary
  useEffect(() => {
    if (!termsInDOM()) setGlossary(null);
  }, [path]);

  return (
    <>
      <div
        id="glossary"
        aria-describedby="glossary-title"
        aria-hidden="true"
        className={[
          'bg-white',
          'height-full',
          'overflow-y-auto',
          'pin-right',
          'position-fixed',
          'shadow-2',
          'top-0',
          'width-mobile',
          'z-top',
        ].join(' ')}
        style={{
          transition: 'right 0.2s',
        }}
      >
        <header className="bg-primary display-flex flex-align-center flex-justify">
          <h2
            className="font-heading-lg margin-left-105 margin-bottom-2px padding-bottom-0 text-white"
            id="glossary-title"
          >
            Glossary
          </h2>
          <button
            className={[
              'bg-primary-dark',
              'font-sans-md',
              'height-4',
              'js-glossary-close',
              'margin-1',
              'padding-0',
              'usa-button',
              'text-white',
              'width-4',
              'hover:bg-primary-darker',
            ].join(' ')}
            title="Close glossary"
            type="button"
          >
            ×
          </button>
        </header>

        <div className="padding-105">
          {content.status === 'failure' && (
            <div className="padding-12">
              <Alert type="error">
                The glossary is temporarily unavailable, please try again later.
              </Alert>
            </div>
          )}

          {content.status === 'success' && (
            <input
              className="border-right-1px js-glossary-search margin-bottom-1 usa-input width-full"
              type="search"
              placeholder="Search for a term..."
              aria-label="Search for a glossary term..."
            />
          )}

          <ul
            className={[
              'add-list-reset',
              'js-glossary-list',
              'margin-top-05',
              'padding-0',
            ].join(' ')}
          />
        </div>
      </div>
    </>
  );
}

type GlossaryTermProps = {
  children: ReactNode;
  term: string;
};

export function GlossaryTerm({ term, children }: GlossaryTermProps) {
  const { content } = useContentState();
  return (
    <span
      className={[
        'border-bottom-1px',
        'border-top-0',
        'border-x-0',
        'border-dotted',
        'border-primary-light',
        'glossary-term',
        'hover:bg-primary-lighter',
        'focus:bg-primary-lighter',
      ].join(' ')}
      data-disabled={content.status !== 'success'}
      data-term={term}
      style={{
        cursor: 'pointer',
        pointerEvents: content.status === 'success' ? 'initial' : 'none',
      }}
      title="Click to define"
      tabIndex={0}
    >
      <>
        <Book
          className="height-2 text-primary-light text-semibold top-2px width-2 usa-icon"
          style={{ fontSize: content.status === 'pending' ? '75%' : '87.5%' }}
          aria-hidden="true"
          focusable="false"
          role="img"
        />
        &nbsp;
        {children}
      </>
    </span>
  );
}
