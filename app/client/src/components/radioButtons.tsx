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
    <fieldset className={`usa-fieldset ${styles.join(' ')}`}>
      <legend className="align-items-center display-flex margin-top-0 usa-legend">
        <b>{label}</b>
        {tooltip && <InfoTooltip text={tooltip} styles={['margin-left-05']} />}
      </legend>
      {options.map((option) => {
        return (
          <div
            key={option.value.toString()}
            className="usa-radio"
            style={{ background: 'inherit', width: 'fit-content' }}
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
