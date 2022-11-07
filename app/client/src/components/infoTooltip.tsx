import { ReactComponent as Info } from 'uswds/img/usa-icons/info.svg';

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
    <button
      type="button"
      className={[
        ...styles,
        'usa-button',
        'usa-tooltip',
        'bg-white',
        'border-0',
        'margin-0',
        'padding-0',
        'width-auto',
        'hover:bg-white',
      ].join(' ')}
      data-position={position}
      title={text}
    >
      <Info
        aria-hidden="true"
        className={[
          'usa-icon',
          'text-primary',
          'focus:text-primary-dark',
          'hover:text-primary-dark',
        ].join(' ')}
        focusable="false"
        role="img"
      />
    </button>
  );
}
