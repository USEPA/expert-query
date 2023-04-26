import type { FunctionComponent, MouseEventHandler, SVGProps } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as Api } from '@uswds/uswds/img/usa-icons/api.svg';
import { ReactComponent as Folder } from '@uswds/uswds/img/usa-icons/folder.svg';
import { ReactComponent as Home } from '@uswds/uswds/img/usa-icons/home.svg';
import { ReactComponent as Book } from '@uswds/uswds/img/usa-icons/local_library.svg';

export default NavBar;

export function NavBar() {
  const navigate = useNavigate();
  console.log(window.location.pathname);
  return (
    <>
      <NavButton
        label="Home"
        icon={Home}
        onClick={() => navigate('/')}
        styles={['margin-right-05']}
      />
      <NavButton
        label="National Downloads"
        icon={Folder}
        onClick={() => navigate('/national-downloads')}
        styles={['margin-right-05']}
      />
      <NavButton
        label="API Documentation"
        icon={Api}
        onClick={() => navigate('/api-documentation')}
        styles={['margin-right-05']}
      />
      {window.location.pathname.match(/^\/attains/) && (
        <NavButton
          label="Glossary"
          icon={Book}
          styles={['js-glossary-toggle']}
        />
      )}
    </>
  );
}

type NavButtonProps = {
  icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  label: string;
  onClick?: MouseEventHandler;
  styles?: string[];
};

export function NavButton({
  icon,
  label,
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

  return (
    <button
      title={label}
      className={buttonStyles}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className="height-2 margin-right-1 text-primary top-2px usa-icon width-2"
        focusable="false"
        role="img"
      />
      <span className="font-ui-md text-bold text-primary">{label}</span>
    </button>
  );
}
