import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// 404 — Not Found ---------------------------------------------------------
// Rendered for any path the router doesn't know about. Kept as a single
// self-contained React component with inline animations so the user always
// lands somewhere sensible, even if they typo'd a route.

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      <div className="nf-glow" />
      <div className="nf-inner">
        <div className="nf-code">404</div>
        <h1>This page went off-script</h1>
        <p>
          The page you are looking for either moved, never existed, or is
          still on the roadmap. Pick a destination below to keep going.
        </p>
        <div className="nf-actions">
          <button type="button" className="nf-btn" onClick={() => navigate(-1)}>
            ← Go back
          </button>
          <Link to="/" className="nf-btn secondary">
            Back to home
          </Link>
          <Link to="/dashboard" className="nf-btn secondary">
            Open dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
