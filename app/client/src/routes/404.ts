import { useEffect } from 'react';
// config
import { serverUrl } from 'config';

type Props = {
  src: string
};


function PageNotFound({ src }: Props) {
  // redirect to the server side 400.html page
  useEffect(() => {
    // append the original url for tracking purposes
    window.location.assign(`${serverUrl}/404.html?src=${src}`);
  }, [src]);

  return null;
}

export default PageNotFound;
