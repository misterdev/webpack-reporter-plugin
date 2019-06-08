const chalk = require('chalk');

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
      `[REPORTER]: ${hookData.hookId} ${
        this.counter[hookData.hookId]
      } -- ${time.getMinutes()}:${time.getSeconds()}:${time.getMilliseconds()} `
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
    console.error(chalk.red(`\n[REPORTER]:\n\n    ${hookData.data}\n`));
  }

  onWarning(hookData) {
    console.error(chalk.yellow(`\n[REPORTER]:\n\n    ${hookData.data}\n`));
  }
}

module.exports = Reporter;
