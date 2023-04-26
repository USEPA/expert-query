import type { FunctionComponent, MouseEventHandler, SVGProps } from 'react';

type NavButtonProps = {
  icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  label: string;
  href?: string;
  onClick?: MouseEventHandler;
  styles?: string[];
};

export function NavButton({
  icon,
  label,
  href,
  onClick = () => {},
  styles = [],
}: NavButtonProps) {
  const buttonStyles = [
    'margin-bottom-2',
    'bg-white',
    'border-2px',
    'border-transparent',
    'padding-1',
    'radius-md',
    'width-auto',
    'hover:bg-white',
    'hover:border-primary',
    ...styles,
  ].join(' ');

  const Icon = icon;

  const innerContent = (
    <>
      <Icon
        aria-hidden="true"
        className="height-2 margin-right-1 text-primary top-2px usa-icon width-2"
        focusable="false"
        role="img"
      />
      <span className="font-ui-md text-bold text-primary">{label}</span>    
    </>
  );

  if (href) {
    return (
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        className={buttonStyles}
        style={{ cursor: 'pointer', lineHeight: 1.15 }}
        type="button"
      >
        {innerContent}
      </a>
    );
  }

  return (
    <button
      title={label}
      className={buttonStyles}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      type="button"
    >
      {innerContent}
    </button>
  );
}
