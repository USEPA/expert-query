import { ReactComponent as Info } from 'uswds/img/usa-icons/info.svg';

const iconStyles = [
  'text-primary',
  'focus:text-primary-dark',
  'hover:text-primary-dark',
];

const triggerStyles = [
  'bg-white',
  'border-0',
  'margin-0',
  'padding-0',
  'hover:bg-white',
];

type Position = 'top' | 'right' | 'bottom' | 'left';

type Props = {
  position?: Position;
  styles?: string[];
  text: string;
};

export default function InfoTooltip({
  position = 'top',
  styles = [],
  text,
}: Props) {
  return (
    <div className={styles.length ? styles.join(' ') : ''}>
      <button
        type="button"
        className={`usa-button usa-tooltip ${triggerStyles.join(' ')}`}
        data-position={position}
        title={text}
      >
        <Info
          aria-hidden="true"
          className={`usa-icon ${iconStyles.join(' ')}`}
          focusable="false"
          role="img"
        />
      </button>
    </div>
  );
}
