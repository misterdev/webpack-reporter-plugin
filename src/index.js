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

"use strict";

const validateOptions = require("schema-utils");
const schema = require("./options.json");
const { Tapable, SyncWaterfallHook } = require("tapable");

const Reporter = require("./reporter");

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
		this.REPORTER_PLUGIN = "ReporterPlugin";

		this.hooks = {
			/** @type {SyncWaterfallHook<HookData>} */
			info: new SyncWaterfallHook(["info"]),
			/** @type {SyncWaterfallHook<HookData>} */
			warn: new SyncWaterfallHook(["warn"]),
			/** @type {SyncWaterfallHook<HookData>} */
			error: new SyncWaterfallHook(["error"]),
			/** @type {SyncWaterfallHook<HookData>} */
			stats: new SyncWaterfallHook(["stats"])
		};

		this.emitInfo = hookData => this.hooks.info.call(hookData);
		this.emitWarn = hookData => this.hooks.warn.call(hookData);
		this.emitError = hookData => this.hooks.error.call(hookData);
		this.emitStats = hookData => this.hooks.stats.call(hookData);

		/** @type {HookStats} */
		this.hookStats = new HookStats();

		this.compilerHooks = [
			"beforeRun",
			"run",
			"watchRun",
			"beforeCompile",
			"compile",
			"compilation",
			"emit",
			"done",
			"failed",
			"invalid",
			"watchClose"
		];
		this.compilationHooks = [
			"buildModule"
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
			// "contentHash",
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

		validateOptions(schema, options, "Reporter Plugin");
		options = Object.assign({}, ReporterPlugin.defaultOptions, options);
		this.reporters = options.reporters;

		for (const hookId in options.throttledHooks) {
			const throttle = options.throttledHooks[hookId];
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
			exclude: ["node_modules", "bower_components", "components"],
			infoVerbosity: "info"
		};

		// Initialize all the reporters
		self.reporters.forEach(reporter => reporter.apply(self, outputOptions));

		// Initialize the compilation hooks
		compiler.hooks.compilation.tap(self.REPORTER_PLUGIN, compilation =>
			self.onCompilation(compilation)
		);

		// Initialize compiler hooks
		self.compilerHooks.forEach(hookName => {
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

		compiler.hooks.done.tap(self.REPORTER_PLUGIN, stats => {
			const hookId = "compiler.done";
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

		self.compilationHooks.forEach(hookName => {
			const hookId = `compilation.${hookName}`;
			if (!hookStats.hasHook(hookId)) {
				hookStats.initHook(hookId);
			}
			compilation.hooks[hookName].tap(self.REPORTER_PLUGIN, data => {
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
	hooks: ["compilation.done"],
	throttledHooks: {
		"compilation.buildModule": 5
	},
	reporters: [new Reporter()]
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
			throttle
		};
	}

	incrementCount(hookId) {
		if (this.hooks[hookId]) {
			this.hooks[hookId].count += 1;
		} else {
			console.error("WTFFFF");
		}
	}

	/**
	 * @param {string} hookId hook's id
	 * @returns {boolean} false if it should be skiipped, true otherwise
	 */
	shouldTrigger(hookId) {
		const hook = this.hooks[hookId];
		if (!hook.throttle) return true;
		else return hook.count % hook.throttle === 0;
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
		// TODO check if exists
		return {
			context: "/foo/bar", // TODO
			hookId,
			count: this.hooks[hookId].count,
			configHash: "abcdefgh", // TODO
			data
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
