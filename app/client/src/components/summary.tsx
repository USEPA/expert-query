import { uniqueId } from 'lodash';
import { useState } from 'react';
import type { ReactNode } from 'react';

/*
## Components
*/

export function Summary({ children, heading, styles = [] }: SummaryProps) {
  const [id] = useState(uniqueId('summary-'));
  return (
    <div
      aria-labelledby={id}
      className={`usa-summary-box ${styles.join(' ')}`}
      role="region"
    >
      {heading && (
        <h2 className="usa-summary-box__heading" id={id}>
          {heading}
        </h2>
      )}
      <div className="usa-summary-box__text">{children}</div>
    </div>
  );
}

/*
## Types
*/

type SummaryProps = {
  children: ReactNode;
  heading?: string;
  styles?: string[];
};
