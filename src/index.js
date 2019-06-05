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

'use strict';

const validateOptions = require('schema-utils');
const schema = require('./options.json');
const { Tapable, SyncWaterfallHook } = require('tapable');

const Reporter = require('./reporter');

const COMPILER_HOOKS = [
  'beforeRun',
  'run',
  'watchRun',
  'beforeCompile',
  'compile',
  'compilation',
  'emit',
  'done',
  'failed',
  'invalid',
  'watchClose',
];

const COMPILATION_HOOKS = [
  'buildModule',
  // "finishModules",
  // "seal",
  // "beforeChunks",
  // "afterChunks",
  // "optimizeDependenciesBasic",
  // "optimizeDependencies",
  // "optimizeDependenciesAdvanced",
  // "afterOptimizeDependencies",
  // "optimize",
  // "optimizeModules",
  // "afterOptimizeModules",
  // "optimizeChunks",
  // "afterOptimizeChunks",
  // "optimizeTree",
  // "afterOptimizeTree",
  // "optimizeChunkModules",
  // "afterOptimizeChunkModules",
  // "reviveModules",
  // "optimizeModuleOrder",
  // "advancedOptimizeModuleOrder",
  // "beforeModuleIds",
  // "moduleIds",
  // "optimizeModuleIds",
  // "afterOptimizeModuleIds",
  // "reviveChunks",
  // "optimizeChunkOrder",
  // "beforeChunkIds",
  // "optimizeChunkIds",
  // "afterOptimizeChunkIds",
  // "recordModules",
  // "recordChunks",
  // "beforeHash",
  'contentHash',
  // "afterHash",
  // "recordHash",
  // "beforeModuleAssets",
  // "beforeChunkAssets",
  // "additionalChunkAssets",
  // "record",
  // "additionalAssets",
  // "optimizeChunkAssets",
  // "afterOptimizeChunkAssets",
  // "optimizeAssets",
  // "afterOptimizeAssets",
  // "afterSeal"
];

/**
 * @typedef { import("./Stats") } Stats
 *
 * @typedef {object} HookData - creates a new type named 'HookData'
 * @property {string} [context] - hook context
 * @property {string} hookId - hook's id
 * @property {number} count - number of times the hook is executed
 * @property {string} configHash - current webpack configuration hash
 * @property {Stats | string} [data] - custom hook data
 */

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

    this.emitInfo = (hookData) => this.hooks.info.call(hookData);
    this.emitWarn = (hookData) => this.hooks.warn.call(hookData);
    this.emitError = (hookData) => this.hooks.error.call(hookData);
    this.emitStats = (hookData) => this.hooks.stats.call(hookData);

    /** @type {HookStats} */
    this.hookStats = new HookStats();

    validateOptions(schema, options, 'Reporter Plugin');
    this.options = Object.assign({}, ReporterPlugin.defaultOptions, options);
    this.reporters = this.options.reporters;

    this.compilerHooks = COMPILER_HOOKS;
    this.compilationHooks = COMPILATION_HOOKS;

    for (const hookId in this.options.hooks) {
      const throttle = this.options.hooks[hookId];
      this.hookStats.initHook(hookId, throttle);
    }
  }

  apply(compiler) {
    const self = this;
    const hookStats = self.hookStats;
    // TODO remove hardcoded
    const outputOptions = compiler.options.stats || {
      context: compiler.context, //TODO
      colors: { level: 3, hasBasic: true, has256: true, has16m: true },
      cached: false,
      cachedAssets: false,
      exclude: ['node_modules', 'bower_components', 'components'],
      infoVerbosity: 'info',
    };

    // Initialize all the reporters
    self.reporters.forEach((reporter) => reporter.apply(self, outputOptions));

    // Initialize the compilation hooks
    compiler.hooks.compilation.tap(self.REPORTER_PLUGIN, (compilation) =>
      self.onCompilation(compilation)
    );

    // Initialize compiler hooks
    self.compilerHooks.forEach((hookName) => {
      const hookId = `compiler.${hookName}`;

      if (!hookStats.hasHook(hookId)) {
        hookStats.initHook(hookId);
      }

      // TODO handle args
      compiler.hooks[hookName].tap(self.REPORTER_PLUGIN, (...args) => {
        const hookData = hookStats.generateHookData(hookId);
        // Emit the log
        self.emitInfo(hookData);
      });
    });

    compiler.hooks.done.tap(self.REPORTER_PLUGIN, (stats) => {
      const hookId = 'compiler.done';
      hookStats.incrementCount(hookId);
      /* @type {HookData} */
      const hookData = hookStats.generateHookData(hookId, stats);
      // Emit the log
      self.emitStats(hookData);
    });
  }

  onCompilation(compilation) {
    const self = this;
    const hookStats = self.hookStats;

    self.compilationHooks.forEach((hookName) => {
      const hookId = `compilation.${hookName}`;
      if (!hookStats.hasHook(hookId)) {
        hookStats.initHook(hookId);
      }
      compilation.hooks[hookName].tap(self.REPORTER_PLUGIN, (data) => {
        hookStats.incrementCount(hookId);
        if (hookStats.shouldTrigger(hookId)) {
          /* @type {HookData} */
          const hookData = hookStats.generateHookData(hookId, data);
          self.emitInfo(hookData);
        }
      });
    });
  }
}

ReporterPlugin.defaultOptions = {
  hooks: {
    all: true,
    'compilation.done': true,
    'compilation.buildModule': 5,
    'compilation.contentHash': '0ms',
  },
  reporters: [new Reporter()],
};
ReporterPlugin.Reporter = Reporter;

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
      console.error('WTFFFF');
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
        shouldTrigger = hook.count % hook.throttle == 0;
      } else if (
        typeof hook.throttle === 'string' &&
        hook.throttle.endsWith('ms')
      ) {
        const delta = parseInt(hook.throttle);
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
      context: '/foo/bar', // TODO
      hookId,
      count: this.hooks[hookId].count,
      configHash: 'abcdefgh', // TODO
      data,
      lastCall: this.hooks[hookId].lastCall,
    };
  }
}

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
