// types
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
      {options.map((option, i) => (
        <div className="usa-checkbox">
          <input
            className={`usa-checkbox__input ${
              tile && 'usa-checkbox__input--tile'
            }`}
            id={`check-${option.value}-${i}`}
            type="checkbox"
            value={option.value}
            checked={isSelected(option, selected)}
            onChange={(_ev) => {
              if (isSelected(option, selected)) {
                onChange(selected.filter((s) => s.value !== option.value));
              } else {
                onChange([...selected, option]);
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
