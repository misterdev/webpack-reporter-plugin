<div align="center">
    <a href="https://github.com/webpack/webpack-cli">
        <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
    </a>
</div>

<h1 align="center">webpack-reporter-plugin</h1>

<p align="center">
  A plugin to customize webpack&#39;s output
</p>
<br>

<p>
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://travis-ci.org/misterdev/webpack-reporter-plugin" target="_blank" >
    <img alt="Build Status" src="https://travis-ci.org/misterdev/webpack-reporter-plugin.svg?branch=master" />
  </a>
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" target="_blank" />
</p>

## Install

You can temporary install the plugin from npm using the following command:

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
    // every parameter is optional
    new ReporterPlugin({
      default: false, // exclude all default hooks, if not set it is true
      hooks: {
        compiler: {
          done: true, // include this hook
          emit: false, // exclude this hook
        },
        compilation: {
          buildModule: 5, // trigger once every 5
          contentHash: '2ms', // trigger at most once every 2ms
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

## Run tests

```sh
npm run test
```

## Author

👤 **Devid Farinelli**

- Twitter: [@misterdev\_](https://twitter.com/misterdev_)
- Github: [@misterdev](https://github.com/misterdev)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/misterdev/webpack-reporter-plugin/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2019 [Devid Farinelli](https://github.com/misterdev).<br />
This project is [MIT]() licensed.

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
