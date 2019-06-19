const ReporterPlugin = require('../src');

it('validation', () => {
  /* eslint-disable no-new */
  expect(() => {
    new ReporterPlugin();
  }).not.toThrow();

  expect(() => {
    new ReporterPlugin({});
  }).not.toThrow();

  expect(() => {
    new ReporterPlugin({
      hooks: {},
    });
  }).not.toThrow();

  expect(() => {
    new ReporterPlugin({
      hooks: {
        compiler: {},
        compilation: {},
      },
    });
  }).not.toThrow();

  expect(() => {
    new ReporterPlugin({
      hooks: {
        compiler: {},
        compilation: {},
      },
    });
  }).not.toThrow();

  expect(() => {
    new ReporterPlugin({
      hooks: {
        compiler: {},
        compilation: {},
      },
    });
  }).not.toThrow();

  expect(() => {
    new ReporterPlugin({
      hooks: {
        defaults: false,
        compiler: {},
        compilation: {},
      },
    });
  }).not.toThrow();

  expect(() => {
    new ReporterPlugin({
      hooks: {
        compiler: {
          done: true,
        },
      },
    });
  }).not.toThrow();

  expect(() => {
    new ReporterPlugin({
      hooks: {
        compiler: {
          done: 2,
        },
      },
    });
  }).not.toThrow();

  expect(() => {
    new ReporterPlugin({
      hooks: {
        compiler: {
          done: '2ms',
        },
      },
    });
  }).not.toThrow();

  expect(() => {
    new ReporterPlugin({
      wrongKey: true,
    });
  }).toThrowErrorMatchingSnapshot();
});
