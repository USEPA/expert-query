// determine which environment we are in
export function getEnvironment() {
  let isLocal = false;
  let isDevelopment = false;
  let isStaging = false;
  let isProduction = false;

  if (process.env.NODE_ENV) {
    isLocal = 'local' === process.env.NODE_ENV.toLowerCase();
    isDevelopment = 'development' === process.env.NODE_ENV.toLowerCase();
    isStaging = 'staging' === process.env.NODE_ENV.toLowerCase();
    isProduction = 'production' === process.env.NODE_ENV.toLowerCase();
  }

  return {
    isLocal,
    isDevelopment,
    isStaging,
    isProduction,
  };
}
