import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
// config
import { serverUrl } from 'config';

export default ApiDocs;

export function ApiDocs() {
  return (
    <>
      <div>
        <SwaggerUI
          url={`${serverUrl}/api/getFile/path/swagger/attains.json`}
          deepLinking={true}
          defaultModelsExpandDepth={-1}
        />
      </div>
    </>
  );
}
