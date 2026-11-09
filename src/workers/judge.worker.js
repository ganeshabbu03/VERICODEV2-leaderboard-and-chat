// Runs untrusted user code in an isolated worker thread (no DOM access).
// The main thread is responsible for enforcing a wall-clock timeout by
// terminating this worker if it never responds — an infinite loop here
// cannot freeze the UI or anything outside this thread.

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((k) => deepEqual(a[k], b[k]));
  }
  return a === b;
}

self.onmessage = (event) => {
  const { code, functionName, tests } = event.data;
  const results = [];
  let userFn;

  try {
    // eslint-disable-next-line no-new-func
    const factory = new Function(`${code}\nreturn typeof ${functionName} === 'function' ? ${functionName} : undefined;`);
    userFn = factory();
    if (typeof userFn !== 'function') {
      throw new Error(`Could not find a function named "${functionName}". Did you rename it?`);
    }
  } catch (err) {
    self.postMessage({
      ok: false,
      compileError: err && err.message ? err.message : String(err)
    });
    return;
  }

  for (let i = 0; i < tests.length; i++) {
    const { args, expected } = tests[i];
    try {
      const actual = userFn(...args);
      results.push({
        index: i,
        passed: deepEqual(actual, expected),
        actual,
        expected,
        args
      });
    } catch (err) {
      results.push({
        index: i,
        passed: false,
        error: err && err.message ? err.message : String(err),
        expected,
        args
      });
    }
  }

  self.postMessage({ ok: true, results });
};
