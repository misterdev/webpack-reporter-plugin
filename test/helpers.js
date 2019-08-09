const { SyncWaterfallHook, SyncHook } = require('tapable');

class MockReporterPlugin {
  constructor() {
    this.hooks = {
      info: new SyncWaterfallHook(['name', 'info']),
      warn: new SyncWaterfallHook(['name', 'warn']),
      error: new SyncWaterfallHook(['name', 'error']),
      stats: new SyncWaterfallHook(['stats']),
    };
    this.emitInfo = (name, hookData) => this.hooks.info.call(name, hookData);
    this.emitWarn = (name, hookData) => this.hooks.warn.call(name, hookData);
    this.emitError = (name, hookData) => this.hooks.error.call(name, hookData);
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

  onInfo(name, hookData) {
    const { hookId, message } = hookData;
    this.incrementHookCounter(hookId);
    this.print(`${name} ${message || hookId}`);
  }

  onError(name, hookData) {
    const error = hookData.data;
    this.print(`${name} ${error}`);
  }

  onWarning(name, hookData) {
    const warn = hookData.data;
    this.print(`${name} ${warn}`);
  }

  print(text) {
    process.stdout.write(`${text}\n`);
  }
}

class MockCompiler {
  constructor(plugin) {
    this.options = {
      infrastructureLogging: {
        level: 'info',
      },
    };
    this.hooks = {
      compilation: new SyncHook(['compilation', 'params']),
    };
    this.compilation = {
      hooks: {
        buildModule: new SyncHook(['module']),
      },
    };
    plugin.apply(this);
    this.hooks.compilation.call(this.compilation);
  }
  run(callback) {
    let counter = 0;
    const callHook = () => {
      this.compilation.hooks.buildModule.call();
    };
    const triggerHook = () => {
      if (counter < 9) {
        counter++;
        callHook();
        setTimeout(triggerHook, 250);
      } else {
        callback();
      }
    };
    setTimeout(triggerHook, 250);
  }
}

const mockReporterPlugin = () => new MockReporterPlugin();
const mockReporter = () => new MockReporter();
const mockCompiler = (plugin) => new MockCompiler(plugin);

module.exports = { mockReporterPlugin, mockReporter, mockCompiler };
