/**
 * @enum {number} */
const LogLevel = {
  none: 6,
  false: 6,
  error: 5,
  warn: 4,
  info: 3,
  log: 2,
  true: 2,
  verbose: 1,
};

/**
 * @enum {string}
 */
const LogType = Object.freeze({
  error: 'error',
  warn: 'warn',
  info: 'info',
  log: 'log',
  debug: 'debug',
  trace: 'trace',
  group: 'group',
  groupCollapsed: 'groupCollapsed',
  groupEnd: 'groupEnd',
  profile: 'profile',
  profileEnd: 'profileEnd',
  time: 'time',
  clear: 'clear',
  status: 'status',
});

module.exports = {
  LogLevel,
  LogType,
};
