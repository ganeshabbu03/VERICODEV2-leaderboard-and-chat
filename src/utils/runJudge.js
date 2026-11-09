const TIME_LIMIT_MS = 3000;

// Runs `code` (must define a function called `functionName`) against `tests`
// inside a fresh Web Worker. Resolves with a normalized result object.
// If the code hangs (e.g. infinite loop), the worker is terminated and a
// "Time Limit Exceeded" result is returned instead of freezing the app.
export function runJudge({ code, functionName, tests }) {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('../workers/judge.worker.js', import.meta.url), {
      type: 'module'
    });

    let settled = false;

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve({ ok: false, timedOut: true, compileError: `Time limit exceeded (${TIME_LIMIT_MS / 1000}s). Check for infinite loops.` });
    }, TIME_LIMIT_MS);

    worker.onmessage = (event) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      worker.terminate();
      resolve(event.data);
    };

    worker.onerror = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      worker.terminate();
      resolve({ ok: false, compileError: err.message || 'Unknown worker error' });
    };

    worker.postMessage({ code, functionName, tests });
  });
}
