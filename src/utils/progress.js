// Lightweight localStorage-backed progress tracking for the Practice module.
// No backend yet, so this keeps solved status + in-progress code drafts on
// the user's own device. Swapping this for real API calls later only means
// changing the bodies of these functions.

const SOLVED_KEY = 'vericode_solved_problems';
const DRAFT_KEY_PREFIX = 'vericode_draft_';

export function getSolvedIds() {
  try {
    const raw = localStorage.getItem(SOLVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isSolved(problemId) {
  return getSolvedIds().includes(problemId);
}

export function markSolved(problemId) {
  const current = getSolvedIds();
  if (!current.includes(problemId)) {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([...current, problemId]));
  }
}

export function getDraft(problemId, fallback) {
  try {
    const raw = localStorage.getItem(DRAFT_KEY_PREFIX + problemId);
    return raw !== null ? raw : fallback;
  } catch {
    return fallback;
  }
}

export function saveDraft(problemId, code) {
  try {
    localStorage.setItem(DRAFT_KEY_PREFIX + problemId, code);
  } catch {
    // localStorage unavailable (private mode / quota) — fail silently
  }
}

export function resetDraft(problemId, starterCode) {
  try {
    localStorage.setItem(DRAFT_KEY_PREFIX + problemId, starterCode);
  } catch {
    // ignore
  }
}
