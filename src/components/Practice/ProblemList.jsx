import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { problems } from '../../data/problems.js';
import { getSolvedIds } from '../../utils/progress.js';
import './practice.css';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

function ProblemList() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [solvedIds, setSolvedIds] = useState([]);

  useEffect(() => {
    setSolvedIds(getSolvedIds());
  }, []);

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      const matchesDifficulty = difficulty === 'All' || p.difficulty === difficulty;
      const matchesSearch =
        search.trim() === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchesDifficulty && matchesSearch;
    });
  }, [search, difficulty]);

  const solvedCount = problems.filter((p) => solvedIds.includes(p.id)).length;

  return (
    <div className="practice-page">
      <header className="practice-header">
        <div>
          <h1>Practice Problems</h1>
          <p className="practice-subtitle">
            Sharpen your skills. {solvedCount} / {problems.length} solved.
          </p>
        </div>
        <Link to="/dashboard" className="practice-back-link">&larr; Back to Dashboard</Link>
      </header>

      <div className="practice-toolbar">
        <input
          type="text"
          className="practice-search"
          placeholder="Search by title or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="practice-filter-group">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`practice-filter-btn${difficulty === d ? ' active' : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="practice-list">
        {filtered.map((p) => {
          const solved = solvedIds.includes(p.id);
          return (
            <Link key={p.id} to={`/practice/${p.id}`} className="practice-card">
              <div className="practice-card-top">
                <span className={`difficulty-badge difficulty-${p.difficulty.toLowerCase()}`}>
                  {p.difficulty}
                </span>
                {solved && <span className="solved-check" title="Solved">&#10003;</span>}
              </div>
              <h3 className="practice-card-title">{p.title}</h3>
              <div className="practice-card-tags">
                {p.tags.map((t) => (
                  <span key={t} className="practice-tag">{t}</span>
                ))}
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="practice-empty">No problems match your filters.</p>
        )}
      </div>
    </div>
  );
}

export default ProblemList;
