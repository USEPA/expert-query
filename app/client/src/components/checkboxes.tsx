import { useEffect, useState } from 'react';
// types
import type { ReactNode } from 'react';

interface Option {
  description?: ReactNode;
  label: ReactNode;
  value: string;
}

type Props = {
  legend?: ReactNode;
  handleChange: (selected: string[]) => void;
  options: Option[];
  tile?: boolean;
};

export default function Checkboxes({
  legend,
  handleChange,
  options,
  tile = false,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    handleChange(selected);
  }, [handleChange, selected]);

  return (
    <fieldset className="usa-fieldset">
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
                setSelected(selected.filter((value) => value !== option.value));
              } else {
                setSelected([...selected, option.value]);
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
