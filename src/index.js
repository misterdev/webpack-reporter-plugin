/*
MIT License http://www.opensource.org/licenses/mit-license.php
Author Devid Farinelli @misterdev
*/

/*
TODO
- multicompiler

HOOK THROTTLING
- always includes first and last within same threshold

NEXT
- hook order
- benchmarks
- formatting utility
*/

const validateOptions = require('schema-utils');
const { Tapable, SyncWaterfallHook } = require('tapable');

const schema = require('./options.json');
const Reporter = require('./reporter');

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
  optimizeDependenciesBasic: selected,
  optimizeDependencies: selected,
  optimizeDependenciesAdvanced: selected,
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
  optimizeModuleOrder: selected,
  advancedOptimizeModuleOrder: selected,
  beforeModuleIds: selected,
  moduleIds: selected,
  optimizeModuleIds: selected,
  afterOptimizeModuleIds: selected,
  reviveChunks: selected,
  optimizeChunkOrder: selected,
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

/**
 * @typedef {object} Stats -- TODO import from webpack
 *
 * @typedef {object} HookData - creates a new type named 'HookData'
 * @property {string} [context] - hook context
 * @property {string} hookId - hook's id
 * @property {number} count - number of times the hook is executed
 * @property {string} configHash - current webpack configuration hash
 * @property {Stats | string} [data] - custom hook data
 * @property {number} lastCall -- last hook trigger timestamp
 */

class HookStats {
  constructor() {
    this.hooks = {};
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
   * @returns {boolean} false if it should be skiipped, true otherwise
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
        // console.log(now, hook.lastCall, now - hook.lastCall, '>=', delta, shouldTrigger, hook.count)
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
    // TODO check if exists
    return {
      // TODO
      context: '/foo/bar',
      hookId,
      count: this.hooks[hookId].count,
      // TODO
      configHash: 'abcdefgh',
      data,
      lastCall: this.hooks[hookId].lastCall,
    };
  }
}

class ReporterPlugin extends Tapable {
  constructor(options = {}) {
    super();
    this.REPORTER_PLUGIN = 'ReporterPlugin';

    this.hooks = {
      /** @type {SyncWaterfallHook<HookData>} */
      info: new SyncWaterfallHook(['info']),
      /** @type {SyncWaterfallHook<HookData>} */
      warn: new SyncWaterfallHook(['warn']),
      /** @type {SyncWaterfallHook<HookData>} */
      error: new SyncWaterfallHook(['error']),
      /** @type {SyncWaterfallHook<HookData>} */
      stats: new SyncWaterfallHook(['stats']),
    };

    this.compilerHooks = {};
    this.compilationHooks = {};

    this.emitInfo = (hookData) => this.hooks.info.call(hookData);
    this.emitWarn = (hookData) => this.hooks.warn.call(hookData);
    this.emitError = (hookData) => this.hooks.error.call(hookData);
    this.emitStats = (hookData) => this.hooks.stats.call(hookData);

    /** @type {HookStats} */
    this.hookStats = new HookStats();

    validateOptions(schema, options, 'Reporter Plugin');
    this.options = Object.assign({}, ReporterPlugin.defaultOptions, options);
    this.reporters = this.options.reporters;

    this.parseHooksOption(this.options.hooks);
  }

  parseHooksOption(hooksOptions) {
    // TODO remove defaults = true
    const { defaults = true, compiler, compilation } = hooksOptions;

    this.compilerHooks = compilerHooks(defaults);
    this.compilationHooks = compilationHooks(defaults);

    if (compiler) {
      for (const hookName in compiler) {
        const throttle = compiler[hookName];
        if (typeof throttle === 'boolean') {
          this.compilerHooks[hookName] = throttle;
        } else {
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
    const { hookStats } = this;
    // TODO remove hardcoded
    const outputOptions = compiler.options.stats || {
      // TODO
      context: compiler.context,
      colors: { level: 3, hasBasic: true, has256: true, has16m: true },
      cached: false,
      cachedAssets: false,
      exclude: ['node_modules', 'bower_components', 'components'],
      infoVerbosity: 'info',
    };

    // Initialize all the reporters
    this.reporters.forEach((reporter) => reporter.apply(this, outputOptions));

    // Initialize the compilation hooks
    compiler.hooks.compilation.tap(this.REPORTER_PLUGIN, (compilation) =>
      this.onCompilation(compilation)
    );

    // Initialize compiler hooks
    for (const hookName in this.compilerHooks) {
      if (this.compilerHooks[hookName]) {
        const hookId = `compiler.${hookName}`;

        if (!hookStats.hasHook(hookId)) {
          hookStats.initHook(hookId);
        }

        // TODO handle args
        compiler.hooks[hookName].tap(this.REPORTER_PLUGIN, (...args) => {
          const hookData = hookStats.generateHookData(hookId);
          // Emit the log
          this.emitInfo(hookData);
        });
      }
    }
    // TODO settable
    compiler.hooks.done.tap(this.REPORTER_PLUGIN, (stats) => {
      const hookId = 'compiler.done';
      if (!hookStats.hasHook(hookId)) {
        hookStats.initHook(hookId);
      }
      /* @type {HookData} */
      const hookData = hookStats.generateHookData(hookId, stats);
      // Emit the log
      this.emitStats(hookData);
    });
    compiler.hooks.failed.tap(this.REPORTER_PLUGIN, (err) => {
      const hookId = 'compiler.failed';
      if (!hookStats.hasHook(hookId)) {
        hookStats.initHook(hookId);
      }
      /* @type {HookData} */
      const hookData = hookStats.generateHookData(hookId, err);
      // Emit the log
      this.emitError(hookData);
    });
  }

  onCompilation(compilation) {
    const { hookStats } = this;

    for (const hookName in this.compilationHooks) {
      if (this.compilationHooks[hookName]) {
        const hookId = `compilation.${hookName}`;
        if (!hookStats.hasHook(hookId)) {
          hookStats.initHook(hookId);
        }
        compilation.hooks[hookName].tap(this.REPORTER_PLUGIN, (data) => {
          hookStats.incrementCount(hookId);
          if (hookStats.shouldTrigger(hookId)) {
            /* @type {HookData} */
            const hookData = hookStats.generateHookData(hookId, data);
            this.emitInfo(hookData);
          }
        });
      }
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

// this.compilationHook = [
// 	"buildModule",
// 	"rebuildModule",
// 	"failedModule",
// 	"succeedModule",
// 	"finishModules",
// 	"seal",
// 	"unseal",
// 	"optimizeDependencies",
// 	"afterOptimizeDependencies",
// 	"optimize",
// 	"optimizeModules",
// 	"afterOptimizeModules",
// 	"optimizeChunks",
// 	"afterOptimizeChunks",
// 	"optimizeTree",
// 	"afterOptimizeTree",
// 	"optimizeChunkModules",
// 	"afterOptimizeChunkModules",
// 	"moduleIds",
// 	"optimizeModuleIds",
// 	"afterOptimizeModuleIds",
// 	"chunkIds",
// 	"optimizeChunkIds",
// 	"afterOptimizeChunkIds",
// 	"beforeModuleHash",
// 	"afterModuleHash",
// 	"record",
// 	"optimizeChunkAssets",
// 	"afterOptimizeChunkAssets",
// 	"moduleAsset"
// ];
