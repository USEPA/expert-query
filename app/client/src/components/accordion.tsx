import { uniqueId } from 'lodash';
import { useCallback, useState } from 'react';
// types
import type { ReactNode } from 'react';

/*
## Components
*/

export function Accordion({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div
      className="margin-top-2 usa-accordion usa-accordion--multiselectable"
      data-allow-multiple={true}
    >
      {children}
    </div>
  );
}

export function AccordionItem({
  children,
  heading,
  initialExpand = false,
}: Readonly<AccordionItemProps>) {
  const [id] = useState(uniqueId('accordion-item-'));
  const [expanded, setExpanded] = useState(initialExpand);

  const toggleExpanded = useCallback(() => setExpanded(!expanded), [expanded]);

  return (
    <div className="margin-top-3 tablet:margin-top-6">
      <h3 className="usa-accordion__heading">
        <button
          type="button"
          className="usa-accordion__button"
          aria-expanded={expanded}
          onClick={toggleExpanded}
        >
          {heading}
        </button>
      </h3>
      {expanded && (
        <div
          className="overflow-visible usa-accordion__content usa-prose"
          id={id}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/*
## Types
*/

type AccordionItemProps = {
  children: ReactNode;
  heading: string;
  initialExpand?: boolean;
};
