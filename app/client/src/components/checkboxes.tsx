// types
import type { ReactNode } from 'react';

interface Option {
  description?: ReactNode;
  label: ReactNode;
  value: string;
}

type Props = {
  legend?: ReactNode;
  onChange: (selected: string[]) => void;
  options: Option[];
  selected?: string[];
  styles?: string[];
  tile?: boolean;
};

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
      {options.map((option, i) => (
        <div className="usa-checkbox">
          <input
            className={`usa-checkbox__input ${
              tile && 'usa-checkbox__input--tile'
            }`}
            id={`check-${option.value}-${i}`}
            type="checkbox"
            value={option.value}
            checked={selected.includes(option.value)}
            onChange={(ev) => {
              if (selected.includes(ev.target.value)) {
                onChange(selected.filter((value) => value !== option.value));
              } else {
                onChange([...selected, option.value]);
              }
            }}
          />
          <label
            className="usa-checkbox__label"
            htmlFor={`check-${option.value}-${i}`}
          >
            {option.label}
            {option.description && (
              <span className="usa-checkbox__label-description">
                {option.description}
              </span>
            )}
          </label>
        </div>
      ))}
    </fieldset>
  );
}
