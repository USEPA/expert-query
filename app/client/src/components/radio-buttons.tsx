import { useEffect, useState } from 'react';
// types
import type { ReactNode } from 'react';

interface Option {
  label: ReactNode;
  value: string;
}

type Props = {
  legend?: ReactNode;
  handleChange: (selected: string) => void;
  options: Option[];
  tile?: boolean;
};

export default function RadioButtons({
  handleChange,
  legend,
  options,
  tile = false,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (selected) handleChange(selected);
  }, [handleChange, selected]);

  return (
    <fieldset className="usa-fieldset">
      {legend && <legend className="usa-legend">{legend}</legend>}
      {options.map((option, i) => (
        <div key={i} className="usa-radio">
          <input
            className={`usa-radio__input ${tile && 'usa-radio__input--tile'}`}
            id={`radio-${option.value}-${i}`}
            type="radio"
            value={option.value}
            checked={option.value === selected}
            onChange={(ev) => {
              setSelected(ev.target.value);
            }}
          />
          <label
            className="usa-radio__label"
            htmlFor={`radio-${option.value}-${i}`}
          >
            {option.label}
          </label>
        </div>
      ))}
    </fieldset>
  );
}
