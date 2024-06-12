import { uniqueId } from 'lodash';
import { useState } from 'react';
// components
import { Checkbox } from 'components/checkbox';
import { InfoTooltip } from 'components/tooltip';
// types
import type { Option } from 'types';

/*
## Components
*/

export function Checkboxes({
  className = '',
  label,
  onChange,
  options,
  selected = [],
  tile = false,
  tooltip,
}: Readonly<CheckboxesProps>) {
  const [id] = useState(uniqueId('checkboxes-'));
  return (
    <fieldset
      aria-labelledby={`${id}-legend`}
      className={`usa-fieldset ${className}`}
    >
      <span className="display-flex flex-align-center line-height-sans-1">
        <legend
          className="font-sans-2xs margin-top-0 text-bold text-uppercase usa-legend"
          id={`${id}-legend`}
        >
          {label}
        </legend>
        {tooltip && (
          <InfoTooltip
            description={`${label} tooltip`}
            text={tooltip}
            className="margin-left-05"
          />
        )}
      </span>
      {options.map((option, i) => {
        return (
          <Checkbox
            checked={isSelected(option, selected)}
            description={option.description}
            key={i}
            label={option.label}
            onChange={(_ev) => {
              if (isSelected(option, selected)) {
                onChange(selected.filter((s) => s.value !== option.value));
              } else {
                onChange([...selected, option]);
              }
            }}
            tile={tile}
            value={option.value?.toString()}
          />
        );
      })}
    </fieldset>
  );
}

/*
## Utils
*/

function isSelected(option: Option, selected: ReadonlyArray<Option>) {
  return !!selected.find((s) => s.value === option.value);
}

/*
## Types
*/

type CheckboxesProps = {
  className?: string;
  label: string;
  onChange: (selected: ReadonlyArray<Option>) => void;
  options: ReadonlyArray<Option>;
  selected?: ReadonlyArray<Option>;
  tile?: boolean;
  tooltip?: string | null;
};
