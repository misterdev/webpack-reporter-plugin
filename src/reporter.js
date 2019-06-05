class Reporter {
  constructor() {
    // Init counters
    this.counter = {};
  }

  apply(reporter, outputOptions) {
    const self = this;
    // Adds a listener for a specific log
    reporter.hooks.info.tap('Reporter', (hookData) => {
      // Formats and prints the output
      self.incrementHookCounter(hookData.hookId);
      const time = new Date(hookData.lastCall);
      console.log(
        `[REPORTER]: ${hookData.hookId} ${
          this.counter[hookData.hookId]
        } -- ${time.getMinutes()}:${time.getSeconds()}:${time.getMilliseconds()} `
      );
    });

    reporter.hooks.stats.tap('Reporter', (hookData) => {
      const statsString = hookData.data.toString(outputOptions);
      // if (statsString) process.stdout.write(`${statsString}\n${"delimiter"}`);
    });
  }

  incrementHookCounter(hookName) {
    if (!this.counter[hookName]) this.counter[hookName] = 0;
    this.counter[hookName] += 1;
  }
}

module.exports = Reporter;
