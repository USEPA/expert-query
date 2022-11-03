import { uniqueId } from 'lodash';
import { useEffect, useState } from 'react';

interface Option {
  label: string;
  value: string;
}

type Props = {
  label: string;
  onChange: (selected: string) => void;
  options: Option[];
  styles?: string[];
};

export default function ComboBox({
  label,
  onChange,
  options,
  styles = [],
}: Props) {
  const [selected, setSelected] = useState<string>('');
  useEffect(() => {
    if (selected) onChange(selected);
  }, [onChange, selected]);

  const [inputId] = useState(uniqueId('combo-box-'));

  return (
    <div className={styles.join(' ')}>
      <label className="text-bold usa-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="usa-combo-box">
        <select
          className="usa-select"
          id={inputId}
          onChange={(ev) => setSelected(ev.target.value)}
          value={selected}
        >
          {options.map((option, i) => (
            <option key={`option-${i}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
