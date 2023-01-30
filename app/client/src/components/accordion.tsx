import { uniqueId } from 'lodash';
import { useCallback, useState } from 'react';
// types
import type { ReactNode } from 'react';

/*
## Components
*/

export function Accordion({ children }: { children: ReactNode }) {
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
}: AccordionItemProps) {
  const [id] = useState(uniqueId('accordion-item-'));
  const [expanded, setExpanded] = useState(initialExpand);

  const toggleExpanded = useCallback(() => setExpanded(!expanded), [expanded]);

  return (
    <div className="margin-top-2">
      <h4 className="usa-accordion__heading">
        <button
          type="button"
          className="usa-accordion__button"
          aria-expanded={expanded}
          onClick={toggleExpanded}
        >
          {heading}
        </button>
      </h4>
      {expanded && (
        <div className="usa-accordion__content usa-prose" id={id}>
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
