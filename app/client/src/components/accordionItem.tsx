import { uniqueId } from 'lodash';
import { useState } from 'react';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  heading: string;
};

export default function AccordionItem({ children, heading }: Props) {
  const [id] = useState(uniqueId('accordion-item-'));
  return (
    <div>
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
