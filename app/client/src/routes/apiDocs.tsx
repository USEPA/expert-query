import { useNavigate } from 'react-router-dom';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { ReactComponent as Home } from 'uswds/img/usa-icons/home.svg';
// components
import { NavButton } from 'components/navButton';
// config
import { serverUrl } from 'config';

export default ApiDocs;

export function ApiDocs() {
  const navigate = useNavigate();

  return (
    <>
      <NavButton label="Home" icon={Home} onClick={() => navigate('/')} />
      <div>
        <SwaggerUI
          url={`${serverUrl}/api/getFile?filepath=swagger/attains.json`}
        />
      </div>
    </>
  );
}
