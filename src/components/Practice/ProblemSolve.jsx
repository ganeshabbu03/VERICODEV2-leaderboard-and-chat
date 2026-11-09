import React, { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { getProblemById } from '../../data/problems.js';
import { getDraft, saveDraft, resetDraft, markSolved, isSolved } from '../../utils/progress.js';
import { runJudge } from '../../utils/runJudge.js';
import CodeEditor from './CodeEditor.jsx';
import ChatAssistant from '../Assistant/ChatAssistant.jsx';
import './practice.css';

function ProblemSolve() {
  const { id } = useParams();
  const problem = getProblemById(id);

  // Hooks must run unconditionally on every render (React Router keeps this
  // component mounted across param changes, e.g. /practice/a -> /practice/b),
  // so all state/effects are declared before the early-return guard below.
  const [code, setCode] = useState(() => getDraft(id, problem ? problem.starterCode : ''));
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [compileError, setCompileError] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [solved, setSolved] = useState(() => isSolved(id));

  useEffect(() => {
    if (!problem) return;
    setCode(getDraft(problem.id, problem.starterCode));
    setResults(null);
    setCompileError(null);
    setShowHints(false);
    setSolved(isSolved(problem.id));
  }, [problem && problem.id]);

  useEffect(() => {
    if (!problem) return;
    const handle = setTimeout(() => saveDraft(problem.id, code), 400);
    return () => clearTimeout(handle);
  }, [code, problem && problem.id]);

  if (!problem) {
    return <Navigate to="/practice" replace />;
  }

  async function handleRun() {
    setRunning(true);
    setResults(null);
    setCompileError(null);

    const outcome = await runJudge({
      code,
      functionName: problem.functionName,
      tests: problem.tests
    });

    setRunning(false);

    if (!outcome.ok) {
      setCompileError(outcome.compileError || 'Unknown error');
      return;
    }

    setResults(outcome.results);

    const allPassed = outcome.results.every((r) => r.passed);
    if (allPassed) {
      markSolved(problem.id);
      setSolved(true);
    }
  }

  function handleReset() {
    resetDraft(problem.id, problem.starterCode);
    setCode(problem.starterCode);
    setResults(null);
    setCompileError(null);
  }

  const passedCount = results ? results.filter((r) => r.passed).length : 0;

  function getAssistantContext() {
    return {
      problem,
      code,
      testSummary: results ? `${passedCount} / ${results.length} tests passed` : null
    };
  }

  return (
    <div className="practice-page practice-solve">
      <ChatAssistant getContext={getAssistantContext} />
      <header className="practice-header">
        <Link to="/practice" className="practice-back-link">&larr; All Problems</Link>
      </header>

      <div className="solve-layout">
        <div className="solve-description">
          <div className="solve-title-row">
            <h1>{problem.title}</h1>
            <span className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}>
              {problem.difficulty}
            </span>
            {solved && <span className="solved-check" title="Solved">&#10003; Solved</span>}
          </div>

          <div className="practice-card-tags">
            {problem.tags.map((t) => (
              <span key={t} className="practice-tag">{t}</span>
            ))}
          </div>

          <p className="solve-description-text">{problem.description}</p>

          {problem.examples.map((ex, i) => (
            <div key={i} className="solve-example">
              <div><strong>Input:</strong> {ex.input}</div>
              <div><strong>Output:</strong> {ex.output}</div>
              {ex.explanation && <div className="solve-example-explanation">{ex.explanation}</div>}
            </div>
          ))}

          {problem.constraints && problem.constraints.length > 0 && (
            <div className="solve-constraints">
              <strong>Constraints:</strong>
              <ul>
                {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {problem.hints && problem.hints.length > 0 && (
            <div className="solve-hints">
              <button className="hints-toggle" onClick={() => setShowHints((s) => !s)}>
                {showHints ? 'Hide hints' : `Show hints (${problem.hints.length})`}
              </button>
              {showHints && (
                <ul>
                  {problem.hints.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="solve-editor-pane">
          <div className="solve-editor-toolbar">
            <button className="solve-run-btn" onClick={handleRun} disabled={running}>
              {running ? 'Running...' : 'Run Tests'}
            </button>
            <button className="solve-reset-btn" onClick={handleReset} disabled={running}>
              Reset
            </button>
          </div>

          <CodeEditor value={code} onChange={setCode} />

          <div className="solve-results">
            {compileError && (
              <div className="result-error">
                <strong>Error:</strong> {compileError}
              </div>
            )}

            {results && !compileError && (
              <>
                <div className={`results-summary ${passedCount === results.length ? 'all-pass' : 'some-fail'}`}>
                  {passedCount} / {results.length} test cases passed
                  {passedCount === results.length && ' — nice work!'}
                </div>
                <ul className="results-list">
                  {results.map((r) => (
                    <li key={r.index} className={r.passed ? 'test-pass' : 'test-fail'}>
                      <span className="test-status">{r.passed ? '✓' : '✗'}</span>
                      <span>
                        Test {r.index + 1}: input {JSON.stringify(r.args)} &rarr; expected{' '}
                        {JSON.stringify(r.expected)}
                        {!r.passed && (
                          <> , got {r.error ? `error: ${r.error}` : JSON.stringify(r.actual)}</>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {!results && !compileError && (
              <p className="solve-results-placeholder">Run your code to see test results here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemSolve;
