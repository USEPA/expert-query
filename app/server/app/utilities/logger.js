import log4js from 'log4js';

log4js.configure({
  appenders: {
    stdout: { type: 'stdout', layout: { type: 'pattern', pattern: '%p - %m' } },
    stdoutFilter: {
      type: 'logLevelFilter',
      appender: 'stdout',
      level: 'TRACE',
      maxLevel: 'WARN',
    },
    stderr: { type: 'stderr', layout: { type: 'pattern', pattern: '%p - %m' } },
    stderrFilter: {
      type: 'logLevelFilter',
      appender: 'stderr',
      level: 'ERROR',
      maxLevel: 'FATAL',
    },
  },
  categories: {
    default: { appenders: ['stderrFilter', 'stdoutFilter'], level: 'all' },
  },
});

const log = log4js.getLogger();

if (process.env.LOGGER_LEVEL)
  log.level = process.env.LOGGER_LEVEL.toUpperCase();
else log.level = 'INFO'; //default level

log.info('LOGGER_LEVEL = ' + log.level);

//We use this function to format most of the error messages to
//work well (support the review) with Cloud.gov (Kibana)
function formatLogMsg(app_metadata, app_message, app_otherinfo) {
  let rtn_obj = { app_metadata: null, app_message: null, app_otherinfo: null };

  if (app_metadata != null) rtn_obj.app_metadata = app_metadata;
  if (app_message != null)
    rtn_obj.app_message = `${app_message} ${app_otherinfo?.toString() ?? ''}`;
  if (app_otherinfo != null) rtn_obj.app_otherinfo = app_otherinfo;

  return JSON.stringify(rtn_obj);
}

//We use this function to pull out important HTTP infromation from the
//request for logging/auditing purposes.
function populateMetdataObjFromRequest(request) {
  let metadata = {};

  metadata.b3 =
    request.header('b3') === undefined ? null : request.header('b3');
  metadata.x_b3_traceid =
    request.header('x-b3-traceid') === undefined
      ? null
      : request.header('x-b3-traceid');
  metadata.x_b3_spanid =
    request.header('x-b3-spanid') === undefined
      ? null
      : request.header('x-b3-spanid');
  metadata.x_b3_parentspanid =
    request.header('x_b3_parentspanid') === undefined
      ? null
      : request.header('x_b3_parentspanid');
  metadata.x_api_key =
    request.header('X-Api-Key') === undefined
      ? null
      : request.header('X-Api-Key');
  metadata.x_api_user_id =
    request.header('x-api-user-id') === undefined
      ? null
      : request.header('x-api-user-id');
  metadata.x_api_umbrella_request_id =
    request.header('x-api-umbrella-request-id') === undefined
      ? null
      : request.header('x-api-umbrella-request-id');

  return metadata;
}

export { formatLogMsg, log, populateMetdataObjFromRequest };
