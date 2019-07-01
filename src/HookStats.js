const message = require('./utils/message');

/**
 * @typedef {object} Stats -- TODO import from webpack
 *
 * @typedef {object} HookStat - webpack hooks stats
 * @property {string} name - hook id
 * @property {number} count - call counter
 * @property {number | string} throttle - throttle frequency
 * @property {lastCall} number - last hook call timestamp
 */

class HookData {
  /**
   * HookData constructor
   * @param {string} [context] - hook context
   * @param {string} hookId - hook's id
   * @param {number} count - number of times the hook is executed
   * @param {Stats | string} [data] - custom hook data
   * @param {number} lastCall -- last hook trigger timestamp
   * @param {string} message -- custom message
   */
  constructor(context, hookId, count = 0, data, lastCall, message) {
    this.context = context;
    this.hookId = hookId;
    this.count = count;
    this.data = data;
    this.lastCall = lastCall;
    this.message = message;
  }
}

class HookStats {
  constructor() {
    this.hooks = {};
  }

  setContext(context) {
    this.context = context;
  }

  initHook(hookId, throttle) {
    this.hooks[hookId] = {
      name: hookId,
      count: 0,
      throttle,
      lastCall: 0,
    };
  }

  incrementCount(hookId) {
    if (this.hooks[hookId]) {
      this.hooks[hookId].count += 1;
    } else {
      console.error('WTFFFF', hookId);
    }
  }

  /**
   * @param {string} hookId hook's id
   * @returns {boolean} false if it should be skipped, true otherwise
   */
  shouldTrigger(hookId) {
    const hook = this.hooks[hookId];
    let shouldTrigger = true;

    if (hook.throttle) {
      if (typeof hook.throttle === 'number') {
        shouldTrigger = hook.count % hook.throttle === 0;
      } else if (
        typeof hook.throttle === 'string' &&
        hook.throttle.endsWith('ms')
      ) {
        const delta = parseInt(hook.throttle, 10);
        const now = Date.now();
        shouldTrigger = now - hook.lastCall >= delta;
      }
    }
    return shouldTrigger;
  }

  /**
   * @param {string} hookId hook's id
   * @returns {boolean} true if the hook exists
   */
  hasHook(hookId) {
    return this.hooks[hookId] !== undefined;
  }

  /**
   * @param {string} hookId hook's id
   * @param {Object} [data] custom hook data
   * @returns {HookData} HookData
   */
  generateHookData(hookId, data) {
    // TODO improve
    if (!this.hooks[hookId]) {
      throw new Error(
        `HOUSTON WE HAVE A SERIOUS PROBLEM, ${hookId} does not exists`
      );
    }
    this.hooks[hookId].lastCall = Date.now();
    const { count, lastCall } = this.hooks[hookId];
    return new HookData(
      this.context,
      hookId,
      count,
      data,
      lastCall,
      message[hookId]
    );
  }
}

module.exports = {
  HookStats,
  HookData,
};
