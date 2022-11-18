import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  heading?: string | null;
  icon?: boolean;
  slim?: boolean;
  styles?: string[];
  type?: 'info' | 'warning' | 'error' | 'success';
}

export default function Alert({
  children,
  heading,
  icon = true,
  slim = false,
  styles = [],
  type = 'info',
}: Props) {
  const alertStyles = [...styles];

  switch (type) {
    case 'info':
      alertStyles.push('usa-alert--info');
      break;
    case 'warning':
      alertStyles.push('usa-alert--warning');
      break;
    case 'error':
      alertStyles.push('usa-alert--error');
      break;
    case 'success':
      alertStyles.push('usa-alert--success');
      break;
  }

  if (slim) styles.push('usa-alert--slim');
  if (!icon) styles.push('usa-alert--no-icon');

  return (
    <div className={`usa-alert ${alertStyles.join(' ')}`} role="alert">
      <div className="usa-alert__body">
        {heading && <h4 className="usa-alert__heading">{heading}</h4>}
        <p className="usa-alert__text">{children}</p>
      </div>
    </div>
  );
}
