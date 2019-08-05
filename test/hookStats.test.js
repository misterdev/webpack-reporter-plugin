const { HookStats } = require('../src/HookStats');

describe('HookStats', () => {
  it('should init hooks', () => {
    const hookStats = new HookStats();
    hookStats.initHook('hook1');
    hookStats.initHook('hook2', 2);
    hookStats.initHook('hook3', '2ms');
    expect(hookStats.hooks.hook1).toMatchSnapshot();
    expect(hookStats.hooks.hook2).toMatchSnapshot();
    expect(hookStats.hooks.hook3).toMatchSnapshot();
  });

  it('should increment hook counter', () => {
    const hookStats = new HookStats();
    hookStats.initHook('hook1');
    hookStats.initHook('hook2', 2);
    hookStats.initHook('hook3', '2ms');
    hookStats.incrementCount('hook1');
    hookStats.incrementCount('hook2');
    hookStats.incrementCount('hook3');
    hookStats.incrementCount('hook1');
    hookStats.incrementCount('hook1');
    expect(hookStats.hooks.hook1).toMatchSnapshot();
    expect(hookStats.hooks.hook2).toMatchSnapshot();
    expect(hookStats.hooks.hook3).toMatchSnapshot();
  });

  it('should know when emitting or throttling', () => {
    const hookStats = new HookStats();
    hookStats.initHook('hook1');
    hookStats.initHook('hook2', 2);
    hookStats.initHook('hook3', '2ms');
    expect(`${hookStats.shouldTrigger('hook1')}`).toMatch('true');
    expect(`${hookStats.shouldTrigger('hook2')}`).toMatch('true');
    expect(`${hookStats.shouldTrigger('hook3')}`).toMatch('true');

    hookStats.incrementCount('hook2');
    expect(`${hookStats.shouldTrigger('hook2')}`).toMatch('false');
    hookStats.incrementCount('hook2');
    expect(`${hookStats.shouldTrigger('hook2')}`).toMatch('true');

    hookStats.hooks.hook3.lastCall = Date.now();
    expect(`${hookStats.shouldTrigger('hook3')}`).toMatch('false');
    hookStats.hooks.hook3.lastCall = Date.now() - 2001;
    expect(`${hookStats.shouldTrigger('hook3')}`).toMatch('true');
  });
});
