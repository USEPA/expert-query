// Cors allow list for private endpoints
const allowlist = [
  'https://owapps-dev.app.cloud.gov',
  'https://owapps-stage.app.cloud.gov',
  'https://owapps.app.cloud.gov',
  'https://owapps.epa.gov',
];

// Cors config for public and private endpoints
export const corsOptions = {
  methods: 'GET,HEAD,POST',
};

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

// Cors config for private endpoints
// This is needed for private endpoints to work within EQ UI.
export function corsOptionsDelegate(req, callback) {
  const corsOptionsRes = { ...corsOptions };
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptionsRes.origin = true; // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptionsRes.origin = false; // disable CORS for this request
  }
  callback(null, corsOptionsRes); // callback expects two parameters: error and options
}
