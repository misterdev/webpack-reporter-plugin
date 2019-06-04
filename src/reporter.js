class Reporter {
	constructor() {
		// Init counters
		this.counter = {};
	}

	apply(reporter, outputOptions) {
		const self = this;
		// Adds a listener for a specific log
		reporter.hooks.info.tap("Reporter", hookData => {
			// Formats and prints the output
			self.incrementHookCounter(hookData.hookId);
			console.log(
				`[REPORTER]: ${hookData.hookId} ${this.counter[hookData.hookId]}`
			);
		});

		reporter.hooks.stats.tap("Reporter", hookData => {
			const statsString = hookData.data.toString(outputOptions);
			if (statsString) process.stdout.write(`${statsString}\n${"delimiter"}`);
		});
	}

	incrementHookCounter(hookName) {
		if (!this.counter[hookName]) this.counter[hookName] = 0;
		this.counter[hookName] += 1;
	}
}

module.exports = Reporter;
