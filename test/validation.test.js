const ReporterPlugin = require('../src');
const Reporter = require('../src/Reporter');

describe('plugin parameters', () => {
  it('should validate option schema', () => {
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
  });

  it('should handle the reporters option', () => {
    expect(() => {
      new ReporterPlugin({
        hooks: {
          compiler: {},
          compilation: {},
        },
        reporters: [],
      });
    }).not.toThrow();

    expect(() => {
      new ReporterPlugin({
        hooks: {
          compiler: {},
          compilation: {},
        },
        reporters: [new Reporter()],
      });
    }).not.toThrow();
  });

  it('should handle the hooks option default', () => {
    expect(() => {
      new ReporterPlugin({
        hooks: {
          defaults: false,
          compiler: {},
          compilation: {},
        },
      });
    }).not.toThrow();
  });

  it('should handle a bool throttle value', () => {
    expect(() => {
      new ReporterPlugin({
        hooks: {
          compiler: {
            done: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('should handle a number throttle value', () => {
    expect(() => {
      new ReporterPlugin({
        hooks: {
          compiler: {
            done: 2,
          },
        },
      });
    }).not.toThrow();
  });

  it('should handle a string throttle value', () => {
    expect(() => {
      new ReporterPlugin({
        hooks: {
          compiler: {
            done: '2ms',
          },
        },
      });
    }).not.toThrow();
  });

  it('should handle an incorrect string as throttle value', () => {
    expect(() => {
      new ReporterPlugin({
        hooks: {
          compiler: {
            done: '2',
          },
        },
      });
    }).toThrowErrorMatchingSnapshot();
  });

  it('should recognize wrong keys', () => {
    expect(() => {
      new ReporterPlugin({
        wrongKey: true,
      });
    }).toThrowErrorMatchingSnapshot();
    expect(() => {
      new ReporterPlugin({
        defaults: true,
      });
    }).toThrowErrorMatchingSnapshot();
  });

  it('should only accept boolean for "hooks.defaults" option', () => {
    expect(() => {
      new ReporterPlugin({
        hooks: {
          defaults: true,
        },
      });
    }).not.toThrow();

    expect(() => {
      new ReporterPlugin({
        hooks: {
          defaults: 'true',
        },
      });
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
      new ReporterPlugin({
        hooks: {
          defaults: 2,
        },
      });
    }).toThrowErrorMatchingSnapshot();
  });

  it('should work for the README example', () => {
    expect(() => {
      new ReporterPlugin({
        hooks: {
          defaults: true,
          compiler: {
            done: true,
            emit: false,
          },
          compilation: {
            buildModule: 5,
            contentHash: '2ms',
          },
        },
        reporters: [new Reporter()],
      });
    }).not.toThrow();
  });
});
