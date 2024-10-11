const location = window.location;

export const clientUrl =
  location.hostname === 'localhost'
    ? `${location.protocol}//${location.hostname}:3000`
    : window.location.origin;

export const serverUrl =
  location.hostname === 'localhost'
    ? `${location.protocol}//${location.hostname}:3002`
    : window.location.origin;
