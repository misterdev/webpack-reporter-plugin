const webpack = require('webpack');
const mockProcess = require('jest-mock-process');

const ReporterPlugin = require('../src/index');

const { mockReporter } = require('./helpers');

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
          },
          reporters: [mockReporter()],
        }),
      ],
    });
    compiler.run((err, stats) => {
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
    compiler.run((err, stats) => {
      expect(mockStdout).not.toHaveBeenCalled();
      mockStdout.mockRestore();
      done();
    });
  });

  it('should not listen default hooks when using "defaults: false"', (done) => {
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
    compiler.run((err, stats) => {
      expect(mockStdout).toHaveBeenCalledWith('Compilation finished\n');
      mockStdout.mockRestore();
      done();
    });
  });

  it('should throttle', (done) => {
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
            compilation: {
              buildModule: 2,
            },
          },
          reporters: [mockReporter()],
        }),
      ],
    });
    compiler.run((err, stats) => {
      expect(mockStdout).toMatchSnapshot();
      mockStdout.mockRestore();
      done();
    });
  });
});
