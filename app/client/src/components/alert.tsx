import type { ReactNode } from 'react';

/*
## Components
*/

export function Alert({
  children,
  heading,
  icon = true,
  slim = false,
  styles = [],
  type = 'info',
}: Readonly<AlertProps>) {
  const alertStyles = [...styles];

  let role = 'alert';
  switch (type) {
    case 'info':
      alertStyles.push('usa-alert--info');
      role = 'region';
      break;
    case 'warning':
      alertStyles.push('usa-alert--warning');
      role = 'region';
      break;
    case 'error':
      alertStyles.push('usa-alert--error');
      break;
    case 'success':
      alertStyles.push('usa-alert--success');
      role = 'status';
      break;
  }

  if (slim) alertStyles.push('usa-alert--slim');
  if (!icon) alertStyles.push('usa-alert--no-icon');

  return (
    <div
      className={`radius-md usa-alert ${alertStyles.join(' ')}`}
      role={role}
    >
      <div className="usa-alert__body">
        {heading && <h4 className="usa-alert__heading">{heading}</h4>}
        <section className="usa-alert__text">{children}</section>
      </div>
    </div>
  );
}

/*
## Types
*/

type AlertProps = {
  children: ReactNode;
  heading?: string | null;
  icon?: boolean;
  slim?: boolean;
  styles?: string[];
  type?: 'info' | 'warning' | 'error' | 'success';
};
