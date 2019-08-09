const webpack = require('webpack');
const mockProcess = require('jest-mock-process');

const ReporterPlugin = require('../src/index');

const { mockReporter, mockCompiler } = require('./helpers');

describe('ReporterPlugin', () => {
  it('should log the default hooks when using "defaults: true"', (done) => {
    const mockStdout = mockProcess.mockProcessStdout();
    const compiler = webpack({
      mode: 'none',
      context: __dirname,
      entry: './fixtures/a',
      plugins: [
        new ReporterPlugin({
          hooks: {
            defaults: true,
            compiler: {
              // disable this until webpack v5
              infrastructureLog: false,
            },
          },
          reporters: [mockReporter()],
        }),
      ],
    });
    compiler.run(() => {
      expect(mockStdout).toMatchSnapshot();
      mockStdout.mockRestore();
      done();
    });
  });

  it('should not print when setting "defaults: false"', (done) => {
    const mockStdout = mockProcess.mockProcessStdout();
    const compiler = webpack({
      mode: 'none',
      context: __dirname,
      entry: './fixtures/a',
      plugins: [
        new ReporterPlugin({
          hooks: {
            defaults: false,
          },
        }),
      ],
    });
    compiler.run(() => {
      expect(mockStdout).not.toHaveBeenCalled();
      mockStdout.mockRestore();
      done();
    });
  });

  it('should listen compiler hooks', (done) => {
    const mockStdout = mockProcess.mockProcessStdout();
    const compiler = webpack({
      mode: 'none',
      context: __dirname,
      entry: './fixtures/a',
      plugins: [
        new ReporterPlugin({
          hooks: {
            defaults: false,
            compiler: {
              done: true,
            },
          },
          reporters: [mockReporter()],
        }),
      ],
    });
    compiler.run(() => {
      expect(mockStdout).toHaveBeenCalledWith(
        'ReporterPlugin Compilation finished\n'
      );
      mockStdout.mockRestore();
      done();
    });
  });

  it('should listen compilation hooks', (done) => {
    const mockStdout = mockProcess.mockProcessStdout();
    const compiler = webpack({
      mode: 'none',
      context: __dirname,
      entry: './fixtures/a',
      plugins: [
        new ReporterPlugin({
          hooks: {
            defaults: false,
            compilation: {
              buildModule: true,
            },
          },
          reporters: [mockReporter()],
        }),
      ],
    });
    compiler.run(() => {
      expect(mockStdout).toHaveBeenCalledWith(
        'ReporterPlugin compilation.buildModule\n'
      );
      mockStdout.mockRestore();
      done();
    });
  });

  it('should log hook once every 2 times', (done) => {
    const mockStdout = mockProcess.mockProcessStdout();
    const compiler = webpack({
      mode: 'none',
      context: __dirname,
      entry: {
        a: './fixtures/a',
        b: './fixtures/b',
        c: './fixtures/c',
        d: './fixtures/d',
        e: './fixtures/e',
      },
      plugins: [
        new ReporterPlugin({
          hooks: {
            defaults: false,
            compilation: {
              buildModule: 2,
            },
          },
          reporters: [mockReporter()],
        }),
      ],
    });
    compiler.run(() => {
      expect(mockStdout).toMatchSnapshot();
      mockStdout.mockRestore();
      done();
    });
  });

  it('should log hook every 1s', (done) => {
    const mockStdout = mockProcess.mockProcessStdout();
    const plugin = new ReporterPlugin({
      hooks: {
        defaults: false,
        compilation: {
          buildModule: '1000ms',
        },
      },
      reporters: [mockReporter()],
    });
    const compiler = mockCompiler(plugin);
    compiler.run(() => {
      expect(mockStdout).toMatchSnapshot();
      mockStdout.mockRestore();
      done();
    });
  });
});
