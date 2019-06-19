const ReporterPlugin = require('../src');
const CJSReporterPlugin = require('../src/cjs');

describe('CJS', () => {
  it('should export plugin', () => {
    expect(CJSReporterPlugin).toEqual(ReporterPlugin);
  });
});
