const Reporter = require('../src/Reporter');

const { mockReporterPlugin } = require('./helpers');

const mockProcess = require('jest-mock-process');

describe('Reporter should listen & print', () => {
  const reporterPlugin = mockReporterPlugin();

  it('info correctly', () => {
    const mockStdout = mockProcess.mockProcessStdout();
    new Reporter().apply(reporterPlugin);

    reporterPlugin.emitInfo({
      hookId: 'compiler.test',
      count: 1,
      data: 'some data',
      lastCall: 1563104659,
      message: 'compiler.test message',
    });
    expect(mockStdout).toHaveBeenCalledWith(
      '[Reporter] 11:44:659 compiler.test message 1\n'
    );
    mockStdout.mockRestore();
  });

  it('warn correctly', () => {
    const mockStdout = mockProcess.mockProcessStdout();
    new Reporter().apply(reporterPlugin);
    reporterPlugin.emitWarn({
      hookId: 'compiler.test',
      count: 1,
      data: 'this is a warn message',
      lastCall: 1563104659,
      message: 'compiler.test message',
    });

    expect(mockStdout).toHaveBeenCalledWith(
      '\n[Reporter]:\n\n    this is a warn message\n\n'
    );
    mockStdout.mockRestore();
  });

  it('error correctly', () => {
    const mockStdout = mockProcess.mockProcessStdout();
    new Reporter().apply(reporterPlugin);
    reporterPlugin.emitError({
      hookId: 'compiler.test',
      count: 1,
      data: new Error('a very bad error!!'),
      lastCall: 1563104659,
      message: 'compiler.test message',
    });

    expect(mockStdout).toHaveBeenCalledWith(
      '\n[Reporter]:\n\n    Error: a very bad error!!\n\n'
    );
    mockStdout.mockRestore();
  });

  it('stats correctly', () => {
    // new Reporter().apply(reporterPlugin);
    // reporterPlugin.emitInfo({
    //     hookId: 'compiler.test',
    //     count: 1,
    //     data: 'some data',
    //     lastCall: 1563104659,
    //     message: 'compiler.test message'
    // });
    // expect(mockStdout).toHaveBeenCalledWith("[Reporter] 0:0:0 compiler.test message 1\n");
  });

  it('should count info correctly', () => {
    const mockStdout = mockProcess.mockProcessStdout();
    new Reporter().apply(reporterPlugin);
    const hookData = {
      hookId: 'compiler.test',
      count: 1,
      data: 'some data',
      lastCall: 1563104659,
      message: 'compiler.test message',
    };

    reporterPlugin.emitInfo(hookData);
    expect(mockStdout).toHaveBeenCalledWith(
      '[Reporter] 11:44:659 compiler.test message 1\n'
    );

    reporterPlugin.emitInfo(hookData);
    expect(mockStdout).toHaveBeenCalledWith(
      '[Reporter] 11:44:659 compiler.test message 2\n'
    );

    reporterPlugin.emitInfo(hookData);
    expect(mockStdout).toHaveBeenCalledWith(
      '[Reporter] 11:44:659 compiler.test message 3\n'
    );
    mockStdout.mockRestore();
  });
});
