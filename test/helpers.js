const { SyncWaterfallHook } = require('tapable');

class MockReporterPlugin {
  constructor() {
    this.hooks = {
      info: new SyncWaterfallHook(['info']),
      warn: new SyncWaterfallHook(['warn']),
      error: new SyncWaterfallHook(['error']),
      stats: new SyncWaterfallHook(['stats']),
    };
    this.emitInfo = (hookData) => this.hooks.info.call(hookData);
    this.emitWarn = (hookData) => this.hooks.warn.call(hookData);
    this.emitError = (hookData) => this.hooks.error.call(hookData);
    this.emitStats = (hookData) => this.hooks.stats.call(hookData);
  }
}

const mockReporterPlugin = () => new MockReporterPlugin();

module.exports = { mockReporterPlugin };
