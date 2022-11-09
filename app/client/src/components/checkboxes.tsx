// components
import Checkbox from 'components/checkbox';
// types
import { uniqueId } from 'lodash';
import type { ReactNode } from 'react';

interface Option {
  description?: ReactNode;
  label: ReactNode;
  value: string;
}

type Props = {
  legend?: ReactNode;
  onChange: (selected: Option[]) => void;
  options: Option[];
  selected?: Option[];
  styles?: string[];
  tile?: boolean;
};

function isSelected(option: Option, selected: Option[]) {
  return !!selected.find((s) => s.value === option.value);
}

export default function Checkboxes({
  legend,
  onChange,
  options,
  selected = [],
  styles = [],
  tile = false,
}: Props) {
  return (
    <fieldset className={`usa-fieldset ${styles.join(' ')}`}>
      {legend && <legend className="usa-legend">{legend}</legend>}
      {options.map((option) => {
        const id = uniqueId('checkbox-');
        return (
          <Checkbox
            checked={isSelected(option, selected)}
            description={option.description}
            id={id}
            key={id}
            label={option.label}
            onChange={(_ev) => {
              if (isSelected(option, selected)) {
                onChange(selected.filter((s) => s.value !== option.value));
              } else {
                onChange([...selected, option]);
              }
            }}
            tile={tile}
            value={option.value}
          />
        );
      })}
    </fieldset>
  );
}
