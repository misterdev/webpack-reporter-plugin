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
    const { hookId, lastCall, data } = hookData;
    // Formats and prints the output
    this.incrementHookCounter(hookId);
    const date = new Date(lastCall);
    const time = `${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`;

    if (hookId === 'compiler.beforeRun' || hookId === 'compiler.watchRun') {
      // TODO uniform parameters
      const compiler = data[0];
      const compilationName = compiler.name ? ` ${compiler.name} ` : ' ';
      this.print(`\nCompilation${  compilationName  }starting…\n`);
    } else if (hookId === 'compiler.done') {
      // TODO uniform parameters
      const compilationName = data.name ? ` ${data.name} ` : ' ';
      this.print(`\nCompilation${  compilationName  }finished\n`);
    } else {
      this.print(
        `${blue('[Reporter]')} ${time} ${green(hookId)} ${yellow(
          this.counter[hookId]
        )}`
      );
    }
  }

  onStats(hookData) {
    const statsString = hookData.data.toString(this.outputOptions);
    const delimiter = this.outputOptions.buildDelimiter
      ? `${this.outputOptions.buildDelimiter}\n`
      : '';
    if (statsString) this.print(`${statsString}\n${delimiter}`);
  }

  onError(hookData) {
    const error = hookData.data;
    const { red, bold } = this.style;

    if (error.name === 'EntryModuleNotFoundError') {
      this.print(
        red(
          bold(
            '\nInsufficient number of arguments or no entry found.' +
              "\nAlternatively, run 'webpack(-cli) --help' for usage info.\n"
          )
        )
      );
    } else {
      this.print(red(`\n[Reporter]:\n\n    ${hookData.data}\n`));
    }
  }

  onWarning(hookData) {
    this.print(
      this.style.yellow(`\n[Reporter]:\n\n    ${hookData.data}\n\u001B[0m`)
    );
  }

  print(text) {
    process.stdout.write(`${text}\n`);
  }
}

module.exports = Reporter;
