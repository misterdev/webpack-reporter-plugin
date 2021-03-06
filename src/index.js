/*
MIT License http://www.opensource.org/licenses/mit-license.php
Author Devid Farinelli @misterdev
*/

const { Tapable, SyncWaterfallHook } = require('tapable');

const validateOptions = require('./utils/validateSchema');
const schema = require('./schema/schema.json');
const Reporter = require('./Reporter');
const { HookStats, HookData } = require('./HookStats');
const formatter = require('./utils/formatter');
const { LogType, LogLevel } = require('./utils/logLevel');
const { compilerHooks, compilationHooks } = require('./utils/hooksConfig');

const REPORTER_PLUGIN = 'ReporterPlugin';

/**
 * @typedef {object} Stats -- // TODO import from webpack
 */
class ReporterPlugin extends Tapable {
  constructor(options = {}) {
    super();

    this.hooks = Object.freeze({
      /** @type {SyncWaterfallHook<String, HookData>} */
      info: new SyncWaterfallHook(['name', 'info']),
      /** @type {SyncWaterfallHook<String, HookData>} */
      warn: new SyncWaterfallHook(['name', 'warn']),
      /** @type {SyncWaterfallHook<String, HookData>} */
      error: new SyncWaterfallHook(['name', 'error']),
      /** @type {SyncWaterfallHook<HookData>} */
      stats: new SyncWaterfallHook(['stats']),
    });

    this.emitInfo = (name, hookData) => this.hooks.info.call(name, hookData);
    this.emitWarn = (name, hookData) => this.hooks.warn.call(name, hookData);
    this.emitError = (name, hookData) => this.hooks.error.call(name, hookData);
    this.emitStats = (hookData) => this.hooks.stats.call(hookData);

    this.compilerHooks = {};
    this.compilationHooks = {};

    /** @type {HookStats} */
    this.hookStats = new HookStats();
    this.formatter = formatter;

    /** @type {String[]} */
    const validationErrors = validateOptions(schema, options);
    if (validationErrors.length) {
      throw new Error(validationErrors[0]);
    }
    this.options = this.defaultOptions(options);

    this.reporters = this.options.reporters;

    this.parseHooksOption(this.options.hooks);
  }

  defaultOptions(options) {
    // A really ugly but working way of defaulting options
    const defaults = ReporterPlugin.defaultOptions;
    const result = Object.assign({}, defaults, options);
    const { hooks } = options;
    if (hooks) {
      result.hooks = Object.assign({}, defaults.hooks, options.hooks);
      if (hooks.compiler) {
        result.hooks.compiler = Object.assign(
          {},
          defaults.hooks.compiler,
          hooks.compiler
        );
      }
      if (hooks.compilation) {
        result.hooks.compilation = Object.assign(
          {},
          defaults.hooks.compilation,
          hooks.compilation
        );
      }
    }
    return result;
  }

  parseHooksOption(hooksOptions) {
    const { defaults, compiler, compilation } = hooksOptions;

    this.compilerHooks = compilerHooks(defaults);
    this.compilationHooks = compilationHooks(defaults);

    // if the user gave
    if (compiler) {
      Object.keys(compiler).forEach((hookName) => {
        const throttle = compiler[hookName];
        // if the value is boolean just enable/disable the hook
        if (typeof throttle === 'boolean') {
          this.compilerHooks[hookName] = throttle;
        } else {
          this.compilerHooks[hookName] = true;
          // if the value is number/string set the throttling
          const hookId = `compiler.${hookName}`;
          this.hookStats.initHook(hookId, throttle);
        }
      });
    }

    if (compilation) {
      Object.keys(compilation).forEach((hookName) => {
        const throttle = compilation[hookName];
        if (typeof throttle === 'boolean') {
          this.compilationHooks[hookName] = throttle;
        } else {
          this.compilationHooks[hookName] = true;
          const hookId = `compilation.${hookName}`;
          this.hookStats.initHook(hookId, throttle);
        }
      });
    }
  }

  apply(compiler, outputOptions) {
    this.hookStats.setContext(compiler.context);

    // Temporary fallback
    const logOptions = compiler.options.infrastructureLogging || {
      level: 'info',
      debug: false,
    };
    /** @type {number} */
    this.infrastructureLogLevel = LogLevel[`${logOptions.level}`];

    outputOptions = outputOptions || compiler.options.stats || {};

    // Initialize all the reporters
    this.reporters.forEach((reporter) => reporter.apply(this, outputOptions));

    // Initialize the compilation hooks
    compiler.hooks.compilation.tap(REPORTER_PLUGIN, (compilation) =>
      this.applyCompilation(compilation)
    );

    // Initialize compiler hooks
    Object.keys(this.compilerHooks).forEach((hookName) => {
      // If the hook is enabled
      if (this.compilerHooks[hookName]) {
        const hookId = `compiler.${hookName}`;
        const hook = compiler.hooks[hookName];
        // If the hook exist
        if (hook) {
          hook.tap(REPORTER_PLUGIN, this.hookHandler(hookId));
        } else {
          this.emitError(REPORTER_PLUGIN, {
            data: `Error: The "${hookId}" hook does not exists`,
          });
        }
      }
    });
  }

  applyCompilation(compilation) {
    for (const hookName in this.compilationHooks) {
      if (this.compilationHooks[hookName]) {
        const hookId = `compilation.${hookName}`;
        const hook = compilation.hooks[hookName];

        if (hook) {
          hook.tap(REPORTER_PLUGIN, this.hookHandler(hookId));
        } else {
          this.emitError(REPORTER_PLUGIN, {
            data: `Error: The "${hookId}" hook does not exists`,
          });
        }
      }
    }
  }

  hookHandler(hookId) {
    const { hookStats } = this;
    const handler = {
      'compiler.done': this.onCompilerDone.bind(this),
      'compiler.failed': this.onCompilerFailed.bind(this),
      'compiler.infrastructureLog': this.onInfrastructureLog.bind(this),
      default: (...args) => {
        hookStats.incrementCount(hookId);
        if (hookStats.shouldTrigger(hookId)) {
          /* @type {HookData} */
          const hookData = hookStats.generateHookData(hookId, args);
          this.emitInfo(REPORTER_PLUGIN, hookData);
        }
      },
    };

    if (!hookStats.hasHook(hookId)) {
      hookStats.initHook(hookId);
    }
    return handler[hookId] || handler.default;
  }

  onCompilerDone(stats) {
    const { hookStats } = this;
    const hookId = 'compiler.done';

    hookStats.incrementCount(hookId);
    if (hookStats.shouldTrigger(hookId)) {
      /* @type {HookData} */
      const hookData = hookStats.generateHookData(hookId, stats);
      this.emitInfo(REPORTER_PLUGIN, hookData);
      this.emitStats(hookData);
    }

    if (stats.hasErrors()) {
      stats.compilation.errors.forEach((err) => {
        const hookData = hookStats.generateHookData(hookId, err);
        this.emitError(REPORTER_PLUGIN, hookData);
      });
    }

    if (stats.hasWarnings()) {
      stats.compilation.warnings.forEach((warn) => {
        const hookData = hookStats.generateHookData(hookId, warn);
        this.emitWarn(REPORTER_PLUGIN, hookData);
      });
    }
  }

  onCompilerFailed(err) {
    const hookId = 'compiler.failed';

    this.hookStats.incrementCount(hookId);
    if (this.hookStats.shouldTrigger(hookId)) {
      /* @type {HookData} */
      const hookData = this.hookStats.generateHookData(hookId, err);
      // Emit the log
      this.emitInfo(REPORTER_PLUGIN, hookData);
      this.emitError(REPORTER_PLUGIN, hookData);
    }
  }

  onInfrastructureLog(name, type, args) {
    const hookId = 'compiler.infrastructureLog';
    const hookData = this.hookStats.generateHookData(hookId, args, args);

    // Check log level before emitting
    if (this.infrastructureLogLevel > LogLevel[`${type}`]) return false;

    switch (type) {
      case LogType.error:
        this.emitError(name, hookData);
        break;
      case LogType.warn:
        this.emitWarn(name, hookData);
        break;
      default:
        this.emitInfo(name, hookData);
    }
    return true;
  }
}

ReporterPlugin.defaultOptions = {
  hooks: {
    defaults: true,
  },
  reporters: [new Reporter()],
};

ReporterPlugin.Reporter = Reporter;

module.exports = ReporterPlugin;
