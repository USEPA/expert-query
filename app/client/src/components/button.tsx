import type { MouseEvent, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  color?: 'blue' | 'white';
  disabled?: boolean;
  onClick: (ev: MouseEvent<HTMLButtonElement>) => void;
  styles?: string[];
};

export function Button({
  children,
  color = 'blue',
  disabled = false,
  onClick,
  styles = [],
}: Readonly<Props>) {
  const buttonStyles: string[] = [...styles];

  switch (color) {
    case 'blue':
      break;
    case 'white':
      buttonStyles.push('usa-button--outline');
      break;
  }

  return (
    <button
      className={`usa-button ${buttonStyles.join(' ')}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
