const chalk = require('chalk');

class Reporter {
  constructor() {
    // Init counters
    this.counter = {};
    this.outputOptions = {};

    this.onInfo = this.onInfo.bind(this);
    this.onStats = this.onStats.bind(this);
    this.onError = this.onError.bind(this);
  }

  incrementHookCounter(hookName) {
    if (!this.counter[hookName]) this.counter[hookName] = 0;
    this.counter[hookName] += 1;
  }

  apply(reporter, outputOptions) {
    const self = this;
    self.outputOptions = outputOptions;
    // Adds a listener for a specific log
    reporter.hooks.info.tap('Reporter', self.onInfo);
    reporter.hooks.stats.tap('Reporter', self.onStats);
    reporter.hooks.error.tap('Reporter', self.onError);
  }

  onInfo(hookData) {
    const self = this;
    // Formats and prints the output
    self.incrementHookCounter(hookData.hookId);
    const time = new Date(hookData.lastCall);
    console.log(
      `[REPORTER]: ${hookData.hookId} ${
        this.counter[hookData.hookId]
      } -- ${time.getMinutes()}:${time.getSeconds()}:${time.getMilliseconds()} `
    );
  }

  onStats(hookData) {
    const self = this;
    const statsString = hookData.data.toString(self.outputOptions);
    if (statsString) process.stdout.write(`${statsString}\n${'delimiter'}`);
  }

  onError(hookData) {
    const self = this;
    console.error(chalk.red(`\n[REPORTER]:\n\n    ${hookData.data}\n`));
  }
}

module.exports = Reporter;
