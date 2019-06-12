/*
MIT License http://www.opensource.org/licenses/mit-license.php
Author Devid Farinelli @misterdev
*/

const validateOptions = require('schema-utils');
const { Tapable, SyncWaterfallHook } = require('tapable');

const schema = require('./options.json');
const Reporter = require('./Reporter');
const Formatter = require('./Formatter');
const HookStats = require('./HookStats');

const REPORTER_PLUGIN = 'ReporterPlugin';

const compilerHooks = (selected) => ({
  beforeRun: selected,
  run: selected,
  watchRun: selected,
  beforeCompile: selected,
  compile: selected,
  compilation: selected,
  emit: selected,
  done: selected,
  failed: selected,
  invalid: selected,
  watchClose: selected,
});

const compilationHooks = (selected) => ({
  buildModule: selected,
  finishModules: selected,
  seal: selected,
  beforeChunks: selected,
  afterChunks: selected,
  // optimizeDependenciesBasic: selected, // DEPRECATED v5
  optimizeDependencies: selected,
  // optimizeDependenciesAdvanced: selected, // DEPRECATED v5
  afterOptimizeDependencies: selected,
  optimize: selected,
  optimizeModules: selected,
  afterOptimizeModules: selected,
  optimizeChunks: selected,
  afterOptimizeChunks: selected,
  optimizeTree: selected,
  afterOptimizeTree: selected,
  optimizeChunkModules: selected,
  afterOptimizeChunkModules: selected,
  reviveModules: selected,
  // optimizeModuleOrder: selected, // DEPRECATED v5
  // advancedOptimizeModuleOrder: selected, // DEPRECATED v5
  beforeModuleIds: selected,
  moduleIds: selected,
  optimizeModuleIds: selected,
  afterOptimizeModuleIds: selected,
  reviveChunks: selected,
  // optimizeChunkOrder: selected, // DEPRECATED v5
  beforeChunkIds: selected,
  optimizeChunkIds: selected,
  afterOptimizeChunkIds: selected,
  recordModules: selected,
  recordChunks: selected,
  beforeHash: selected,
  contentHash: selected,
  afterHash: selected,
  recordHash: selected,
  beforeModuleAssets: selected,
  beforeChunkAssets: selected,
  additionalChunkAssets: selected,
  record: selected,
  additionalAssets: selected,
  optimizeChunkAssets: selected,
  afterOptimizeChunkAssets: selected,
  optimizeAssets: selected,
  afterOptimizeAssets: selected,
  afterSeal: selected,
});

/** TODO REMOVE DUPLICATE
 * @typedef {object} Stats -- TODO import from webpack
 * @typedef {object} HookData - creates a new type named 'HookData'
 * @property {string} [context] - hook context
 * @property {string} hookId - hook's id
 * @property {number} count - number of times the hook is executed
 * @property {Stats | string} [data] - custom hook data
 * @property {number} lastCall -- last hook trigger timestamp
 */

class ReporterPlugin extends Tapable {
  constructor(options = {}) {
    super();

    this.hooks = Object.freeze({
      /** @type {SyncWaterfallHook<HookData>} */
      info: new SyncWaterfallHook(['info']),
      /** @type {SyncWaterfallHook<HookData>} */
      warn: new SyncWaterfallHook(['warn']),
      /** @type {SyncWaterfallHook<HookData>} */
      error: new SyncWaterfallHook(['error']),
      /** @type {SyncWaterfallHook<HookData>} */
      stats: new SyncWaterfallHook(['stats']),
    });

    this.emitInfo = (hookData) => this.hooks.info.call(hookData);
    this.emitWarn = (hookData) => this.hooks.warn.call(hookData);
    this.emitError = (hookData) => this.hooks.error.call(hookData);
    this.emitStats = (hookData) => this.hooks.stats.call(hookData);

    this.compilerHooks = {};
    this.compilationHooks = {};

    /** @type {HookStats} */
    this.hookStats = new HookStats();
    /** @type {Formatter} */
    this.formatter = new Formatter();

    validateOptions(schema, options, 'Reporter Plugin');
    this.options = this.defaultOptions(options);

    this.reporters = this.options.reporters;

    this.parseHooksOption(this.options.hooks);
  }

  defaultOptions(options) {
    // TODO a really ugly but working way of defaulting options
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
      for (const hookName in compiler) {
        const throttle = compiler[hookName];
        // if the value is boolean just enable/disable the hook
        if (typeof throttle === 'boolean') {
          this.compilerHooks[hookName] = throttle;
        } else {
          // if the value is number/string set the throttling
          const hookId = `compiler.${hookName}`;
          this.hookStats.initHook(hookId, throttle);
        }
      }
    }

    if (compilation) {
      for (const hookName in compilation) {
        const throttle = compilation[hookName];
        if (typeof throttle === 'boolean') {
          this.compilationHooks[hookName] = throttle;
        } else {
          const hookId = `compilation.${hookName}`;
          this.hookStats.initHook(hookId, throttle);
        }
      }
    }
  }

  apply(compiler) {
    this.hookStats.setContext(compiler.context);
    // TODO remove hardcoded
    const outputOptions = compiler.options.stats || {
      colors: true,
    };

    // Initialize all the reporters
    this.reporters.forEach((reporter) => reporter.apply(this, outputOptions));

    // Initialize the compilation hooks
    compiler.hooks.compilation.tap(REPORTER_PLUGIN, (compilation) =>
      this.applyCompilation(compilation)
    );

    // Initialize compiler hooks
    for (const hookName in this.compilerHooks) {
      // If the hook is enabled
      if (this.compilerHooks[hookName]) {
        const hookId = `compiler.${hookName}`;
        // If the hook exist
        if (compiler.hooks[hookName]) {
          compiler.hooks[hookName].tap(
            REPORTER_PLUGIN,
            this.hookHandler(hookId)
          );
        } else {
          // TODO pass it to the Reporter?
          console.error(
            this.formatter.red(
              `[ReporterPlugin] Error: The "${hookId}" hook does not exists`
            )
          );
        }
      }
    }
  }

  applyCompilation(compilation) {
    for (const hookName in this.compilationHooks) {
      if (this.compilationHooks[hookName]) {
        const hookId = `compilation.${hookName}`;

        if (compilation.hooks[hookName]) {
          compilation.hooks[hookName].tap(
            REPORTER_PLUGIN,
            this.hookHandler(hookId)
          );
        } else {
          console.log(
            this.formatter.red(
              `[ReporterPlugin] Error: The "${hookId}" hook does not exists`
            )
          );
        }
      }
    }
  }

  hookHandler(hookId) {
    const { hookStats } = this;
    const handler = {
      'compiler.done': this.onCompilerDone.bind(this),
      'compiler.failed': this.onCompilerFailed,
      default: (...args) => {
        hookStats.incrementCount(hookId);
        if (hookStats.shouldTrigger(hookId)) {
          /* @type {HookData} */
          const hookData = hookStats.generateHookData(hookId, args);
          this.emitInfo(hookData);
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

    if (stats.hasErrors()) {
      stats.compilation.errors.forEach((err) => {
        const hookData = hookStats.generateHookData(hookId, err);
        this.emitError(hookData);
      });
    }

    if (stats.hasWarnings()) {
      stats.compilation.warnings.forEach((warn) => {
        const hookData = hookStats.generateHookData(hookId, warn);
        this.emitWarn(hookData);
      });
    }

    hookStats.incrementCount(hookId);
    if (hookStats.shouldTrigger(hookId)) {
      /* @type {HookData} */
      const hookData = hookStats.generateHookData(hookId, stats);
      this.emitInfo(hookData);
      this.emitStats(hookData);
    }
  }

  onCompilerFailed(err) {
    const hookId = 'compiler.failed';

    this.hookStats.incrementCount(hookId);
    if (this.hookStats.shouldTrigger(hookId)) {
      /* @type {HookData} */
      const hookData = this.hookStats.generateHookData(hookId, err);
      // Emit the log
      this.emitInfo(hookData);
      this.emitError(hookData);
    }
  }
}

ReporterPlugin.defaultOptions = {
  hooks: {
    defaults: true,
    compiler: {
      done: true,
    },
    compilation: {
      buildModule: 5,
      contentHash: '4ms',
    },
  },
  reporters: [new Reporter()],
};

ReporterPlugin.Reporter = Reporter;

module.exports = ReporterPlugin;
