import ReporterPlugin from '../src';
import CJSReporterPlugin from '../src/cjs';

describe('CJS', () => {
  it('should export plugin', () => {
    expect(CJSReporterPlugin).toEqual(ReporterPlugin);
  });
});