type Props = {
  ariaLabel?: string;
  dual?: boolean;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  step?: number;
  styles?: string[];
  value: number;
};

export default function RangeSlider({
  ariaLabel,
  min = 0,
  max = 100,
  onChange,
  step = 1,
  styles = [],
  value,
}: Props) {
  return (
    <div className={styles.join(' ')}>
      <input
        aria-label={ariaLabel ?? 'Range input'}
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={value}
        className="usa-range"
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
