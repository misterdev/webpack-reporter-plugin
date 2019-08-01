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

class MockReporter {
  constructor() {
    this.counter = {};
    this.outputOptions = {};

    this.onInfo = this.onInfo.bind(this);
    this.onError = this.onError.bind(this);
    this.onWarning = this.onWarning.bind(this);
  }

  incrementHookCounter(hookName) {
    if (!this.counter[hookName]) this.counter[hookName] = 0;
    this.counter[hookName] += 1;
  }

  apply(reporter, outputOptions) {
    this.outputOptions = outputOptions || {};

    reporter.hooks.info.tap('Reporter', this.onInfo);
    reporter.hooks.error.tap('Reporter', this.onError);
    reporter.hooks.warn.tap('Reporter', this.onWarning);
  }

  onInfo(hookData) {
    const { hookId, message } = hookData;
    this.incrementHookCounter(hookId);
    this.print(message || hookId);
  }

  onError(hookData) {
    const error = hookData.data;
    this.print(error);
  }

  onWarning(hookData) {
    const warn = hookData.data;
    this.print(warn);
  }

  print(text) {
    process.stdout.write(`${text}\n`);
  }
}

const mockReporterPlugin = () => new MockReporterPlugin();
const mockReporter = () => new MockReporter();

module.exports = { mockReporterPlugin, mockReporter };
