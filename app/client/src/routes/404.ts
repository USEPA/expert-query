import { useEffect } from 'react';
// config
import { serverUrl } from 'config';

type Props = {
  src: string
};


function PageNotFound({ src }: Props) {
  // redirect to the server side 400.html page
  useEffect(() => {
    const location = window.location;

    let url = `${serverUrl}/404.html`;
    if (location.hostname === 'localhost') {
      url = `${location.protocol}//${location.hostname}:9090/404.html`;
    }

    // append the original url for tracking purposes
    url += `?src=${src}`;

    window.location.assign(url);
  }, [src]);

  return null;
}

export default PageNotFound;
