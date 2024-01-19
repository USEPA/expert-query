import log4js from 'log4js';

log4js.configure({
  appenders: {
    stdout: { type: 'stdout', layout: { type: 'messagePassThrough' } },
    stdoutFilter: {
      type: 'logLevelFilter',
      appender: 'stdout',
      level: 'TRACE',
      maxLevel: 'WARN',
    },
    stderr: { type: 'stderr', layout: { type: 'messagePassThrough' } },
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

export const log = log4js.getLogger();

if (process.env.LOGGER_LEVEL)
  log.level = process.env.LOGGER_LEVEL.toUpperCase();
else log.level = 'INFO'; //default level

log.info('LOGGER_LEVEL = ' + log.level);
