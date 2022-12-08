import { uniqueId } from 'lodash';
import { useState } from 'react';
// types
import type { ReactNode } from 'react';

type RadioOption = Option<ReactNode, string>;

type Props = {
  legend?: ReactNode;
  onChange: (selected: RadioOption) => void;
  options: readonly RadioOption[];
  selected?: RadioOption | null;
  styles?: string[];
  tile?: boolean;
};

export default function RadioButtons({
  legend,
  onChange,
  options,
  selected = null,
  styles = [],
  tile = false,
}: Props) {
  const [id] = useState(uniqueId('radio-'));
  return (
    <fieldset className={`usa-fieldset ${styles.join(' ')}`}>
      {legend && (
        <legend className="align-items-center display-flex usa-legend">
          {legend}
        </legend>
      )}
      {options.map((option) => {
        return (
          <div key={option.value} className="usa-radio">
            <input
              className={`usa-radio__input ${tile && 'usa-radio__input--tile'}`}
              id={`${id}-${option.value}`}
              type="radio"
              value={option.value}
              checked={option.value === selected?.value}
              onChange={(_ev) => onChange(option)}
            />
            <label
              className="usa-radio__label"
              htmlFor={`${id}-${option.value}`}
            >
              {option.label}
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}
