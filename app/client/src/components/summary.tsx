import { uniqueId } from 'lodash';
import { useState } from 'react';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  heading?: string;
  styles?: string[];
};

export default function Summary({ children, heading, styles = [] }: Props) {
  const [id] = useState(uniqueId('summary-'));
  return (
    <div
      aria-labelledby={id}
      className={`usa-summary-box ${styles.join(' ')}`}
      role="region"
    >
      {heading && (
        <h3 className="usa-summary-box__heading" id={id}>
          {heading}
        </h3>
      )}
      <div className="usa-summary-box__text">{children}</div>
    </div>
  );
}
