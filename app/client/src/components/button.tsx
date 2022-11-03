import type { MouseEvent, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  color?: 'blue' | 'red' | 'cyan' | 'orange' | 'white' | 'gray';
  disabled?: boolean;
  onClick: (ev: MouseEvent<HTMLButtonElement>) => void;
  size?: 'small' | 'large';
  styles?: string[];
  type?: 'button' | 'submit';
};

export default function Button({
  children,
  color = 'blue',
  disabled = false,
  onClick,
  size = 'small',
  styles = [],
  type = 'button',
}: Props) {
  const buttonStyles: string[] = [...styles];

  switch (color) {
    case 'blue':
      break;
    case 'red':
      buttonStyles.push('usa-button--secondary');
      break;
    case 'cyan':
      buttonStyles.push('usa-button--accent-cool');
      break;
    case 'orange':
      buttonStyles.push('usa-button--accent-warm');
      break;
    case 'white':
      buttonStyles.push('usa-button--outline');
      break;
    case 'gray':
      buttonStyles.push('usa-button--base');
      break;
  }

  if (size === 'large') buttonStyles.push('usa-button--big');

  return (
    <button
      className={`usa-button ${buttonStyles.join(' ')}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
