import { uniqueId } from 'lodash';
import { useState } from 'react';
// types
import type { ReactNode } from 'react';

type Props = {
  label: ReactNode;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  step?: number;
  styles?: string[];
  value: number;
};

export default function RangeSlider({
  label,
  min = 0,
  max = 100,
  onChange,
  step = 1,
  styles = [],
  value,
}: Props) {
  const [id] = useState(uniqueId('range-slider-'));
  return (
    <div className={styles.join(' ')}>
      <label className="usa-label" htmlFor={id}>
        {label}
      </label>
      <input
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={value}
        className="usa-range"
        id={id}
        step={step}
        max={max}
        min={min}
        onChange={(ev) => onChange(ev.target.valueAsNumber)}
        type="range"
        value={value}
      />
    </div>
  );
}
