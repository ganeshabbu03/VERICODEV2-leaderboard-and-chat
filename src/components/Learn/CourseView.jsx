import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getCourseById, getAllLessons, getAdjacentLessonIds } from '../../data/courses.js';
import { isLessonComplete, markLessonComplete } from '../../utils/learnProgress.js';
import { runJudge } from '../../utils/runJudge.js';
import CodeEditor from '../Practice/CodeEditor.jsx';
import './learn.css';

function ExerciseLesson({ course, lesson, onComplete }) {
  const [code, setCode] = useState(lesson.starterCode);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [compileError, setCompileError] = useState(null);

  useEffect(() => {
    setCode(lesson.starterCode);
    setResults(null);
    setCompileError(null);
  }, [lesson.id]);

  async function handleRun() {
    setRunning(true);
    setResults(null);
    setCompileError(null);

    const outcome = await runJudge({
      code,
      functionName: lesson.functionName,
      tests: lesson.tests
    });

    setRunning(false);

    if (!outcome.ok) {
      setCompileError(outcome.compileError || 'Unknown error');
      return;
    }

    setResults(outcome.results);
    if (outcome.results.every((r) => r.passed)) {
      onComplete();
    }
  }

  const passedCount = results ? results.filter((r) => r.passed).length : 0;

  return (
    <div className="lesson-exercise">
      <p className="lesson-exercise-description">{lesson.description}</p>
      <CodeEditor value={code} onChange={setCode} />
      <div className="lesson-exercise-toolbar">
        <button className="solve-run-btn" onClick={handleRun} disabled={running}>
          {running ? 'Running...' : 'Run Tests'}
        </button>
      </div>
      <div className="solve-results">
        {compileError && (
          <div className="result-error"><strong>Error:</strong> {compileError}</div>
        )}
        {results && !compileError && (
          <>
            <div className={`results-summary ${passedCount === results.length ? 'all-pass' : 'some-fail'}`}>
              {passedCount} / {results.length} test cases passed
              {passedCount === results.length && ' — lesson complete!'}
            </div>
            <ul className="results-list">
              {results.map((r) => (
                <li key={r.index} className={r.passed ? 'test-pass' : 'test-fail'}>
                  <span className="test-status">{r.passed ? '✓' : '✗'}</span>
                  <span>
                    Test {r.index + 1}: input {JSON.stringify(r.args)} &rarr; expected {JSON.stringify(r.expected)}
                    {!r.passed && <> , got {r.error ? `error: ${r.error}` : JSON.stringify(r.actual)}</>}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        {!results && !compileError && (
          <p className="solve-results-placeholder">Run your code to check it against the test cases.</p>
        )}
      </div>
    </div>
  );
}

function QuizLesson({ lesson, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
  }, [lesson.id]);

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === lesson.correctIndex) {
      onComplete();
    }
  }

  const isCorrect = submitted && selected === lesson.correctIndex;

  return (
    <div className="lesson-quiz">
      <p className="lesson-quiz-question">{lesson.question}</p>
      <div className="lesson-quiz-options">
        {lesson.options.map((option, i) => {
          const isSelected = selected === i;
          const showAsCorrect = submitted && i === lesson.correctIndex;
          const showAsWrong = submitted && isSelected && i !== lesson.correctIndex;
          return (
            <button
              key={i}
              className={`quiz-option${isSelected ? ' selected' : ''}${showAsCorrect ? ' correct' : ''}${showAsWrong ? ' wrong' : ''}`}
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
            >
              {option}
            </button>
          );
        })}
      </div>
      {!submitted && (
        <button className="solve-run-btn" onClick={handleSubmit} disabled={selected === null}>
          Submit Answer
        </button>
      )}
      {submitted && (
        <div className={`quiz-feedback ${isCorrect ? 'all-pass' : 'some-fail'}`}>
          {isCorrect ? 'Correct — lesson complete!' : 'Not quite.'} {lesson.explanation}
        </div>
      )}
    </div>
  );
}

function CourseView() {
  const { courseId, lessonId } = useParams();
  const course = getCourseById(courseId);
  const [, forceUpdate] = useState(0);

  if (!course) {
    return <Navigate to="/learn" replace />;
  }

  const allLessons = getAllLessons(course);

  if (!lessonId) {
    return <Navigate to={`/learn/${course.id}/${allLessons[0].id}`} replace />;
  }

  const lesson = allLessons.find((l) => l.id === lessonId);
  if (!lesson) {
    return <Navigate to={`/learn/${course.id}/${allLessons[0].id}`} replace />;
  }

  const { nextId } = getAdjacentLessonIds(course, lesson.id);

  function handleComplete() {
    markLessonComplete(course.id, lesson.id);
    forceUpdate((n) => n + 1);
  }

  return (
    <div className="learn-page course-view">
      <header className="learn-header">
        <div>
          <h1>{course.title}</h1>
          <p className="learn-subtitle">{course.description}</p>
        </div>
        <Link to="/learn" className="learn-back-link">&larr; All Courses</Link>
      </header>

      <div className="course-view-layout">
        <nav className="course-sidebar">
          {course.modules.map((module) => (
            <div key={module.id} className="sidebar-module">
              <div className="sidebar-module-title">{module.title}</div>
              {module.lessons.map((l) => {
                const complete = isLessonComplete(course.id, l.id);
                const active = l.id === lesson.id;
                return (
                  <Link
                    key={l.id}
                    to={`/learn/${course.id}/${l.id}`}
                    className={`sidebar-lesson${active ? ' active' : ''}${complete ? ' complete' : ''}`}
                  >
                    <span className="sidebar-lesson-check">{complete ? '✓' : ''}</span>
                    {l.title}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="lesson-content">
          <div className="lesson-content-header">
            <span className="lesson-type-tag">{lesson.type}</span>
            <h2>{lesson.title}</h2>
          </div>

          {lesson.type === 'reading' && (
            <>
              <p className="lesson-reading-text">{lesson.content}</p>
              {lesson.codeExample && (
                <pre className="lesson-code-example"><code>{lesson.codeExample}</code></pre>
              )}
              <button className="solve-run-btn" onClick={handleComplete}>
                {isLessonComplete(course.id, lesson.id) ? 'Completed ✓' : 'Mark as Read'}
              </button>
            </>
          )}

          {lesson.type === 'exercise' && (
            <ExerciseLesson course={course} lesson={lesson} onComplete={handleComplete} />
          )}

          {lesson.type === 'quiz' && (
            <QuizLesson lesson={lesson} onComplete={handleComplete} />
          )}

          <div className="lesson-nav-row">
            {nextId ? (
              <Link to={`/learn/${course.id}/${nextId}`} className="lesson-next-btn">
                Next Lesson &rarr;
              </Link>
            ) : (
              <span className="lesson-course-done">You've reached the end of this course 🎉</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseView;
