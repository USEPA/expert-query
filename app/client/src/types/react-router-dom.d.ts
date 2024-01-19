import * as reactRouterDom from 'react-router-dom';
declare module 'react-router-dom' {
  declare interface Location {
    hash: string;
    host: string;
    hostname: string;
    href: string;
    origin: string;
    pathname: string;
    port: string;
    protocol: string;
  }
}
