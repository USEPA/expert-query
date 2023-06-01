import { uniqueId } from 'lodash';
import { useState } from 'react';
// components
import { InfoTooltip } from 'components/infoTooltip';
// types
import type { Option } from 'types';

/*
## Components
*/

export function RadioButtons({
  label,
  onChange,
  options,
  selected = null,
  styles = [],
  tile = false,
  tooltip,
}: RadioButtonsProps) {
  const [id] = useState(uniqueId('radio-'));
  return (
    <fieldset
      aria-labelledby={`${id}-label`}
      className={`usa-fieldset ${styles.join(' ')}`}
    >
      <span className="display-flex flex-align-center font-sans-2xs line-height-sans-1 margin-top-0 text-bold text-uppercase usa-legend">
        <legend id={`${id}-label`}>{label}</legend>{' '}
        {tooltip && (
          <InfoTooltip
            description={`${label} tooltip`}
            text={tooltip}
            styles={['margin-left-05']}
          />
        )}
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
  label: string;
  onChange: (selected: RadioOption) => void;
  options: readonly RadioOption[];
  selected?: RadioOption | null;
  styles?: string[];
  tile?: boolean;
  tooltip?: string | null;
};

type RadioOption = Option;
