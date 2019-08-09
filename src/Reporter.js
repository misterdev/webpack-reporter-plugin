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

  onInfo(name, hookData) {
    const { hookId, lastCall, data, message } = hookData;
    // Formats and prints the output
    this.incrementHookCounter(hookId);
    const date = new Date(lastCall);
    const time = `${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;
    this.print(
      `[${name}] ${time} ${message || hookId} ${this.counter[hookId]}`
    );
  }

  onStats(hookData) {
    const statsString = hookData.data.toString(this.outputOptions);
    const delimiter = this.outputOptions.buildDelimiter
      ? `${this.outputOptions.buildDelimiter}\n`
      : '';
    if (statsString) this.print(`${statsString}\n${delimiter}`);
  }

  onError(name, hookData) {
    const error = hookData.data;

    if (error.name === 'EntryModuleNotFoundError') {
      this.print(
        '\nInsufficient number of arguments or no entry found.' +
          "\nAlternatively, run 'webpack(-cli) --help' for usage info.\n"
      );
    } else {
      this.print(`\n[${name}]:\n\n    ${hookData.data}\n`);
    }
  }

  onWarning(name, hookData) {
    this.print(`\n[${name}]:\n\n    ${hookData.data}\n`);
  }

  print(text) {
    process.stdout.write(`${text}\n`);
  }
}

module.exports = Reporter;
