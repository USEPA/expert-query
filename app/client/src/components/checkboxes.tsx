// components
import Checkbox from 'components/checkbox';
// types
import type { ReactNode } from 'react';

type CheckboxOption = Option<ReactNode, string> & {
  description?: ReactNode;
};

type Props = {
  legend?: ReactNode;
  onChange: (selected: CheckboxOption[]) => void;
  options: CheckboxOption[];
  selected?: CheckboxOption[];
  styles?: string[];
  tile?: boolean;
};

function isSelected(option: CheckboxOption, selected: CheckboxOption[]) {
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
            value={option.value}
          />
        );
      })}
    </fieldset>
  );
}
