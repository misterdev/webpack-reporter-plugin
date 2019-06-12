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
    this.style = reporter.formatter;
    // Adds a listener for a specific log
    reporter.hooks.info.tap('Reporter', this.onInfo);
    reporter.hooks.stats.tap('Reporter', this.onStats);
    reporter.hooks.error.tap('Reporter', this.onError);
    reporter.hooks.warn.tap('Reporter', this.onWarning);
  }

  onInfo(hookData) {
    const { blue, yellow, green } = this.style;
    // Formats and prints the output
    this.incrementHookCounter(hookData.hookId);
    const date = new Date(hookData.lastCall);
    const time = `${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;

    console.log(
      `${blue('[Reporter]')} ${time} ${green(hookData.hookId)} ${yellow(
        this.counter[hookData.hookId]
      )}`
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
    console.error(this.style.red(`\n[Reporter]:\n\n    ${hookData.data}\n`));
  }

  onWarning(hookData) {
    console.error(
      this.style.yellow(`\n[Reporter]:\n\n    ${hookData.data}\n\u001B[0m`)
    );
  }
}

module.exports = Reporter;
