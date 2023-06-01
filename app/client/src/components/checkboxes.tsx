// components
import { Checkbox } from 'components/checkbox';
import { InfoTooltip } from 'components/infoTooltip';
// types
import type { Option } from 'types';

/*
## Components
*/

export function Checkboxes({
  label,
  onChange,
  options,
  selected = [],
  styles = [],
  tile = false,
  tooltip,
}: CheckboxesProps) {
  return (
    <fieldset className={`usa-fieldset ${styles.join(' ')}`}>
      <legend className="display-flex flex-align-center font-sans-2xs line-height-sans-1 margin-top-0 text-bold text-uppercase usa-legend">
        {label}{' '}
        {tooltip && (
          <InfoTooltip
            description={`${label} tooltip`}
            text={tooltip}
            styles={['margin-left-05']}
          />
        )}
      </legend>
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
            value={option.value.toString()}
          />
        );
      })}
    </fieldset>
  );
}

/*
## Utils
*/

function isSelected(option: Option, selected: ReadonlyArray<Option>) {
  return !!selected.find((s) => s.value === option.value);
}

/*
## Types
*/

type CheckboxesProps = {
  label: string;
  onChange: (selected: ReadonlyArray<Option>) => void;
  options: ReadonlyArray<Option>;
  selected?: ReadonlyArray<Option>;
  styles?: string[];
  tile?: boolean;
  tooltip?: string | null;
};
