/**
 * @typedef {object} Stats -- TODO import from webpack
 * @typedef {object} HookData - creates a new type named 'HookData'
 * @property {string} [context] - hook context
 * @property {string} hookId - hook's id
 * @property {number} count - number of times the hook is executed
 * @property {Stats | string} [data] - custom hook data
 * @property {number} lastCall -- last hook trigger timestamp
 */

class HookStats {
  constructor() {
    this.hooks = {};
  }

  setContext(context) {
    this.context = context;
  }

  // TODO datatype
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
    this.hooks[hookId].lastCall = Date.now();
    const { count, lastCall } = this.hooks[hookId];
    // TODO check if exists
    return {
      context: this.context,
      hookId,
      count,
      data,
      lastCall,
    };
  }
}

module.exports = HookStats;
