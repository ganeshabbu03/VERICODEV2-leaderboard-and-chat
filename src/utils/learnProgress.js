// localStorage-backed lesson completion tracking for the Learn module.
// Mirrors src/utils/progress.js (used by Practice), kept separate so the
// two feature areas don't share a key namespace or get confused later
// when a real backend replaces both.

const COMPLETED_KEY = 'vericode_completed_lessons';

function lessonKey(courseId, lessonId) {
  return `${courseId}:${lessonId}`;
}

function getCompletedSet() {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isLessonComplete(courseId, lessonId) {
  return getCompletedSet().includes(lessonKey(courseId, lessonId));
}

export function markLessonComplete(courseId, lessonId) {
  const key = lessonKey(courseId, lessonId);
  const current = getCompletedSet();
  if (!current.includes(key)) {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...current, key]));
  }
}

export function getCompletedCountForCourse(courseId, lessonIds) {
  const completed = getCompletedSet();
  return lessonIds.filter((id) => completed.includes(lessonKey(courseId, id))).length;
}
