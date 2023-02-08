import { uniqueId } from 'lodash';
import { useState } from 'react';

/*
## Components
*/

export function ClearSearchButton({ onClick }: ClearSearchButtonProps) {
  const [id] = useState(uniqueId('button-'));
  return (
    <button
      id={id}
      className="margin-top-1 margin-x-auto usa-button usa-button--outline"
      onClick={onClick}
      type="button"
    >
      Clear Search
    </button>
  );
}

/*
## Types
*/

type ClearSearchButtonProps = {
  onClick: () => void;
};
