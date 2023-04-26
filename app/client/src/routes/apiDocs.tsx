import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
// components
import { NavBar } from 'components/navBar';
// config
import { serverUrl } from 'config';

export default ApiDocs;

export function ApiDocs() {
  return (
    <>
      <NavBar />
      <div>
        <SwaggerUI
          url={`${serverUrl}/api/getFile?filepath=swagger/attains.json`}
          deepLinking={true}
          defaultModelsExpandDepth={-1}
        />
      </div>
    </>
  );
}
