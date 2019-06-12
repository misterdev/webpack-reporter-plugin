class Reporter {
  constructor() {
    // Init counters
    this.counter = {};
    this.outputOptions = {};

    this.onInfo = this.onInfo.bind(this);
    this.onStats = this.onStats.bind(this);
    this.onError = this.onError.bind(this);
    this.onWarning = this.onWarning.bind(this);
  }

  incrementHookCounter(hookName) {
    if (!this.counter[hookName]) this.counter[hookName] = 0;
    this.counter[hookName] += 1;
  }

  apply(reporter, outputOptions) {
    this.outputOptions = outputOptions;
    // Adds a listener for a specific log
    reporter.hooks.info.tap('Reporter', this.onInfo);
    reporter.hooks.stats.tap('Reporter', this.onStats);
    reporter.hooks.error.tap('Reporter', this.onError);
    reporter.hooks.warn.tap('Reporter', this.onWarning);
  }

  onInfo(hookData) {
    // Formats and prints the output
    this.incrementHookCounter(hookData.hookId);
    const time = new Date(hookData.lastCall);
    console.log(
      `\u001B[34m[REPORTER]:\u001B[0m ${time.getMinutes()}:${time.getSeconds()}:${time.getMilliseconds()}\u001B[32m ${
        hookData.hookId
      } \u001B[33m${this.counter[hookData.hookId]}\u001B[0m`
    );
  }

  onStats(hookData) {
    const statsString = hookData.data.toString(this.outputOptions);
    const delimiter = this.outputOptions.buildDelimiter
      ? `${this.outputOptions.buildDelimiter}\n`
      : '';
    // if (statsString) process.stdout.write(`${statsString}\n${delimiter}`);
  }

  onError(hookData) {
    console.error(`\u001B[31m\n[REPORTER]:\n\n    ${hookData.data}\n\u001B[0m`);
  }

  onWarning(hookData) {
    console.error(`\u001B[33m\n[REPORTER]:\n\n    ${hookData.data}\n\u001B[0m`);
  }
}

module.exports = Reporter;
