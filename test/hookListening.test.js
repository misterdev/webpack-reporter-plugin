const webpack = require('webpack');
const mockProcess = require('jest-mock-process');

const ReporterPlugin = require('../src/index');

const { mockReporter } = require('./helpers');

describe('ReporterPlugin', () => {
  // when using defaults true
  // false
  // throttling
  it('should print the default hooks when using "defaults: true"', (done) => {
    const mockStdout = mockProcess.mockProcessStdout();
    const compiler = webpack({
      mode: 'production',
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
});
