// components
import { Checkbox } from 'components/checkbox';
// types
import type { ReactNode } from 'react';
import type { Option } from 'types';

/*
## Components
*/

export function Checkboxes({
  legend,
  onChange,
  options,
  selected = [],
  styles = [],
  tile = false,
}: CheckboxesProps) {
  return (
    <fieldset className={`usa-fieldset ${styles.join(' ')}`}>
      {legend && <legend className="usa-legend">{legend}</legend>}
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
            value={option.value.toString()}
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
  legend?: ReactNode;
  onChange: (selected: ReadonlyArray<Option>) => void;
  options: ReadonlyArray<Option>;
  selected?: ReadonlyArray<Option>;
  styles?: string[];
  tile?: boolean;
};
