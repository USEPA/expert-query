import { uniqueId } from 'lodash';
import { useState } from 'react';
// components
import { InfoTooltip } from 'components/tooltip';
// types
import type { Option } from 'types';

/*
## Components
*/

export function RadioButtons({
  className = '',
  label,
  onChange,
  options,
  selected = null,
  tile = false,
  tooltip,
}: RadioButtonsProps) {
  const [id] = useState(uniqueId('radio-'));
  return (
    <fieldset className={`usa-fieldset ${className}`}>
      <span className="display-flex flex-align-center line-height-sans-1">
        <legend className="font-sans-2xs margin-top-0 text-bold text-uppercase usa-legend">
          {label}
        </legend>
        {tooltip && <InfoTooltip text={tooltip} className="margin-left-05" />}
      </span>
      {options.map((option) => {
        return (
          <div
            key={option.value.toString()}
            className="usa-radio bg-inherit width-fit"
          >
            <input
              className={`usa-radio__input ${tile && 'usa-radio__input--tile'}`}
              id={`${id}-${option.value}`}
              type="radio"
              value={option.value.toString()}
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

/*
## Types
*/

type RadioButtonsProps = {
  className?: string;
  label: string;
  onChange: (selected: RadioOption) => void;
  options: readonly RadioOption[];
  selected?: RadioOption | null;
  tile?: boolean;
  tooltip?: string | null;
};

type RadioOption = Option;
