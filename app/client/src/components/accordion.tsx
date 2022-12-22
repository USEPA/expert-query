import { uniqueId } from 'lodash';
import { useState } from 'react';
// types
import type { ReactNode } from 'react';

type AccordionProps = {
  border?: boolean;
  children: ReactNode;
  multiSelect?: boolean;
  styles?: string[];
};

export function Accordion({
  border = false,
  children,
  multiSelect = true,
  styles = [],
}: AccordionProps) {
  const accordionStyles = [...styles];
  if (multiSelect) accordionStyles.push('usa-accordion--multiselectable');
  if (border) accordionStyles.push('usa-accordion--bordered');

  return (
    <div
      className={`usa-accordion ${accordionStyles.join(' ')}`}
      data-allow-multiple={multiSelect}
    >
      {children}
    </div>
  );
}

type AccordionItemProps = {
  children: ReactNode;
  heading: string;
};

export function AccordionItem({ children, heading }: AccordionItemProps) {
  const [id] = useState(uniqueId('accordion-item-'));
  return (
    <div className="margin-top-2">
      <h4 className="usa-accordion__heading">
        <button
          type="button"
          className="usa-accordion__button"
          aria-expanded="true"
          aria-controls={id}
        >
          {heading}
        </button>
      </h4>
      <div className="usa-accordion__content usa-prose" id={id}>
        {children}
      </div>
    </div>
  );
}

export default Accordion;
