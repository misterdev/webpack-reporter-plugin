<div align="center">
    <a href="https://github.com/webpack/webpack-cli">
        <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
    </a>
</div>

<h1 align="center">webpack-reporter-plugin</h1>

<p align="center">
  A plugin to customize webpack&#39s output
</p>
<br>
<p>
  <a href="https://www.npmjs.com/package/test-webpack-reporter-plugin">
    <img src="https://img.shields.io/npm/v/test-webpack-reporter-plugin.svg"
    />
  </a>
  <a href="https://travis-ci.org/misterdev/webpack-reporter-plugin" target="_blank" >
    <img alt="Build Status" src="https://travis-ci.org/misterdev/webpack-reporter-plugin.svg?branch=master" />
  </a>
  <a href="https://codecov.io/gh/misterdev/webpack-reporter-plugin">
    <img src="https://codecov.io/gh/misterdev/webpack-reporter-plugin/branch/master/graph/badge.svg" />
  </a>
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" target="_blank" />
</p>

### Table of Contents

- [Description](#description)
- [Install](#install)
- [Usage](#usage)
- [Configuration](#configuration)
- [Custom Reporters](#custom-reporters)
- [HookData Structure](#hookdata-structure)
- [Testing](#testing)

## Description

There are currently 2 ways of customizing webpack's output, you can set the “[stats](https://webpack.js.org/configuration/stats/)” option to configure which bundle information you want to display or you can write a plugin (e.g. [ProgressPlugin](https://webpack.js.org/plugins/progress-plugin/), [webpackbar](https://github.com/nuxt/webpackbar), [friendly-errors-webpack-plugin](https://github.com/geowarin/friendly-errors-webpack-plugin)).
The second approach gives you more control over the output but requires a good knowledge of how webpack works internally. This plugin abstract over webpack's internals helping writing custom reporters.

## Install

You can install the plugin from npm using the following command:

```sh
npm install test-webpack-reporter-plugin --save-dev
```

or

```sh
yarn add test-webpack-reporter-plugin -D
```

## Usage

You can use it like any other plugin in your webpack configuration:

**webpack.config.js**

```js
module.exports = {
  // ...
  plugins: [
    // each parameter is optional
    new ReporterPlugin({
      hooks: {
        defaults: true,
        // wheter or not include the default hooks [default: true]
        compiler: {
          done: true, // listen this hook
          emit: false, // don't listen this hook
        },
        compilation: {
          buildModule: 5, // log this hook once every 5 times
          contentHash: '2ms', // log this hook at most once every 2ms
        },
      },
      reporters: [
        // one or more custom reporters
        // this is the default one, used if no reporter is given
        new ReporterPlugin.Reporter(),
      ],
    }),
  ],
};
```

Here's an example of how the output will look like (coloured for readability):

<div align="center">
  <img src="./docs/video/new-output.gif" />
</div>

## Configuration

This plugin accepts an obect as parameter containing two properties:

### reporters (optional)

An array containing one or more reporters that will log the events emitted by this plugin. If not set, a default one will be used.

```js
const MyReporter = require('./MyReporter');
//...
new ReporterPlugin({
  reporters: [new MyReporter()],
});
```

### hooks (optional)

An object used to configure which webpack hooks the plugin should listen and log. It can have those properties:

- **defaults (optional)**

  Tells the plugin if it should listen to a predefined set of hooks (e.g. `compilation.done`).
  Setting it to `false` will exclude every default hook, otherwise its default value is `true`.

- **compiler (optional)**

  Tells the plugin which [compiler hooks](https://webpack.js.org/api/compiler-hooks/) should be included or excluded

  ```js
  new ReporterPlugin({
    hooks: {
      compiler: {
        beforeRun: false, // don't log this hook
        done: true, // listen this hook
      },
    },
  });
  ```

- **compilation (optional)**

  Tells the plugin which [compilation hooks](https://webpack.js.org/api/compilation-hooks/) should be included or excluded

  ```js
  new ReporterPlugin({
    hooks: {
      compilation: {
        seal: false, // don't log this hook
        record: true, // log this hook
      },
    },
  });
  ```

### Throttling

Some hooks like `compilation.buildModule` may be called many times during a webpack compilation, it is possible to limit the frequency of logging for specific hooks setting a "throttle value" that could be:

- **integer**

  Meaning that the hook will be logged once every given number of times the hook is called (e.g. once very 2 times)

  ```js
  new ReporterPlugin({
    hooks: {
      compilation: {
        buildModule: 2,
      },
    },
  });
  ```

- **string**

  A string encoding a milliseconds value (e.g. "2ms", '20ms') meaning that the hook will be logged once every given milliseconds

  ```js
  new ReporterPlugin({
    hooks: {
      compilation: {
        buildModule: '2ms',
      },
    },
  });
  ```

## Custom Reporters

This plugin can be extended with one or more reporters. A custom reporter is similar to a usual webpack plugin:

**reporter.js**

```js
class Reporter {
  apply(reporter, outputOptions) {
    // Adds a listener for a specific log
    reporter.hooks.info.tap('Reporter', this.onInfo);
    reporter.hooks.stats.tap('Reporter', this.onStats);
    reporter.hooks.error.tap('Reporter', this.onError);
    reporter.hooks.warn.tap('Reporter', this.onWarning);
  }
  onInfo(hookData) {
    // print something
  }
}
```

## HookData Structure

The reporter plugin has 4 sync waterfall hooks (see [tapable](https://github.com/webpack/tapable)): `stats`, `info`, `warn` and `error`. Each hook callback receives some data with this structure:

```js
// data emitted by each reporter hook
const hookData = {
  hookId: 'compiler.done', // hook's id
  count: 0, // counter of times the hook is executed
  lastCall: 1561725682, // last hook trigger timestamp
  message: 'Compilation finished', // custom message
  context: {...}, // optional, hook context
  data: {} // custom hook data
}
```

## Testing

```sh
npm run test
```

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/misterdev/webpack-reporter-plugin/issues).

## Show your support

Give a ⭐️ if this project helped you!

👤 **Devid Farinelli**

- Twitter: [@misterdev\_](https://twitter.com/misterdev_)
- Github: [@misterdev](https://github.com/misterdev)

## 📝 License

Copyright © 2019 [Devid Farinelli](https://github.com/misterdev).<br />
This project is [MIT]() licensed.

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
