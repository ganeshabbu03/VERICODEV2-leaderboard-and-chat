import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

// -------------------------------------------------------------------------
// Dashboard — proper React rebuild (no more iframe).
//
// The old dashboard embedded raw HTML via an <iframe srcDoc=…>. That worked
// for screenshots, but it isolated the dashboard from React Router, our
// theme system, and toasts. This file is the in-tree replacement: same look
// (sidebar nav, topbar, hero stat cards, recent activity, mock Monaco
// editor), none of the iframe tax. It supports multiple views that switch
// in-place so the visual identity matches what users had before.
// -------------------------------------------------------------------------

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard' },
  { id: 'learning',      label: 'Learning' },
  { id: 'practice',      label: 'Practice' },
  { id: 'projects',      label: 'Project Ideas' },
  { id: 'ai-assistant',  label: 'AI Assistant' },
  { id: 'leaderboard',   label: 'Leaderboard' },
  { id: 'community',     label: 'Community' },
  { id: 'settings',      label: 'Settings' },
];

const ICONS = {
  dashboard: (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  learning: (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  practice: (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  projects: (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  'ai-assistant': (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  leaderboard: (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  community: (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  settings: (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

function Profile({ profile, onSignOut }) {
  const { theme, toggleTheme } = useTheme();
  const firstName = (profile?.name || profile?.username || 'there').split(' ')[0];

  return (
    <aside className="dash-sidebar" aria-label="Dashboard navigation">
      <div className="brand">
        <Link to="/" className="logo-container" title="Vericode AI">
          <img src="/logo_white.jpg" alt="" className="logo-img" />
          <span className="logo-text">VERICODE AI</span>
        </Link>
      </div>

      <nav>
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={item.id === 'dashboard' ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  const root = document.documentElement;
                  if (root.dataset.dashActive) {
                    root.dataset.dashActive = item.id;
                  }
                  root.dispatchEvent(new CustomEvent('dashboard:navigate', { detail: item.id }));
                }}
              >
                {ICONS[item.id]}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="side-foot">
        <div className="theme-toggle">
          <div className="label">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {theme === 'dark' ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
                </>
              )}
            </svg>
            <span>{theme === 'dark' ? 'Dark' : 'Light'} mode</span>
          </div>
          <button
            type="button"
            className="theme-switch"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          />
        </div>

        <button
          type="button"
          className="sign-out"
          onClick={() => {
            onSignOut();
          }}
          title={`Sign out ${firstName}`}
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

// -------------------------------------------------------------------------
// Mock Monaco editor. NOT the real Monaco — we render a styled <textarea>
// with line numbers so the demo "feels" like the IDE without bundling the
// 7 MB Monaco editor. The output panel below it is purely cosmetic: typing
// "console.log" then running gives a fake stdout. We deliberately don't fake
// compile anything because the goal is UI demonstration only.
// -------------------------------------------------------------------------

const MONACO_SNIPPET = `// Two-sum — only used inside the demo Monaco.
// Replace freely, then press Run (Cmd/Ctrl + Enter).
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (map.has(need)) return [map.get(need), i];
    map.set(nums[i], i);
  }
  return [];
}

// Click Run to (mock) execute this.
console.log(twoSum([2, 7, 11, 15], 9));
`;

function MockMonaco() {
  const [code, setCode] = useState(MONACO_SNIPPET);
  const [output, setOutput] = useState('');

  const lineCount = useMemo(() => code.split('\n').length, [code]);

  function handleRun() {
    if (/twoSum\(\[2, *7, *11, *15\], *9\)/.test(code)) {
      setOutput([
        '[stdout] > running two-sum.js',
        '[stdout] [ 0, 1 ]',
        '[stdout] ✓ 1 test passed.',
      ].join('\n'));
    } else if (/console\.log/.test(code)) {
      setOutput(
        '[stdout] > demo run complete',
        '[stdout] (no test results — this is a UI demo)'
      );
      setOutput('[stdout] > demo run complete\n[stdout] (no test results — this is a UI demo)');
    } else {
      setOutput('[stdout] > demo run complete\n[stdout] (no tests in this snippet)');
    }
  }

  function handleReset() {
    setCode(MONACO_SNIPPET);
    setOutput('');
  }

  function handleKey(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  }

  return (
    <div className="dash-monaco-card" aria-label="Mock code editor">
      <div className="monaco-bar">
        <div className="left">
          <span className="dots" aria-hidden="true"><span /><span /><span /></span>
          <span className="title">two-sum.js — Demo Editor</span>
        </div>
        <div className="actions">
          <button type="button" onClick={handleReset}>Reset</button>
          <button type="button" className="run" onClick={handleRun}>▶ Run</button>
        </div>
      </div>
      <div className="dash-monaco-body">
        <div className="line-numbers" aria-hidden="true">
          {Array.from({ length: lineCount }).map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKey}
          spellCheck={false}
          aria-label="Code editor"
          rows={Math.max(lineCount, 6)}
        />
      </div>
      {output ? (
        <pre className="mock-output" aria-live="polite">
          {output.split('\n').map((line, i) => {
            if (line.includes('✓')) {
              return <div key={i} className="ok">{line}</div>;
            }
            if (line.toLowerCase().includes('error')) {
              return <div key={i} className="err">{line}</div>;
            }
            return <div key={i}>{line}</div>;
          })}
        </pre>
      ) : null}
    </div>
  );
}

// -------------------------------------------------------------------------
// Individual view bodies. Each view is a small, opinionated block so the
// dashboard feels rich without us pulling in 8 separate route files. Real
// deep-dives (Practice problem lists, the chat, etc.) still live under
// their own routes — the dashboard surfaces a focused slice.
// -------------------------------------------------------------------------

function ViewDashboard({ profile }) {
  const firstName = (profile?.name || profile?.username || 'there').split(' ')[0];

  return (
    <div className="dash-content">
      <div className="dash-welcome">
        <div>
          <h1>Welcome back, {firstName}.</h1>
          <p>Pick up where you left off. Your active workspaces and recent runs are below.</p>
        </div>
      </div>

      <div className="dash-stat-grid">
        <div className="dash-stat-card">
          <span className="label">Streak</span>
          <span className="value">14d</span>
          <span className="delta">+2 since yesterday</span>
        </div>
        <div className="dash-stat-card">
          <span className="label">Problems solved</span>
          <span className="value">68</span>
          <span className="delta">+5 this week</span>
        </div>
        <div className="dash-stat-card">
          <span className="label">Hours learned</span>
          <span className="value">23.5</span>
          <span className="delta">on pace with goal</span>
        </div>
        <div className="dash-stat-card">
          <span className="label">Rank</span>
          <span className="value">#42</span>
          <span className="delta">top 4 % globally</span>
        </div>
      </div>

      <div className="dash-panel-grid">
        <section className="dash-card" aria-label="Recent activity">
          <h3>Recent activity</h3>
          <div className="activity-row success">
            <span className="bullet" />
            <div>
              <div className="title">Solved "Two Sum"</div>
              <div className="meta">2 minutes ago • Practice</div>
            </div>
          </div>
          <div className="activity-row success">
            <span className="bullet" />
            <div>
              <div className="title">Finished lesson: "Hash maps, deep dive"</div>
              <div className="meta">Yesterday • Learning</div>
            </div>
          </div>
          <div className="activity-row warn">
            <span className="bullet" />
            <div>
              <div className="title">Code review flagged a SQL injection risk</div>
              <div className="meta">Yesterday • AI Assistant</div>
            </div>
          </div>
          <div className="activity-row">
            <span className="bullet" />
            <div>
              <div className="title">Joined the #interview-prep room</div>
              <div className="meta">2 days ago • Community</div>
            </div>
          </div>
        </section>

        <section className="dash-card" aria-label="Today focus">
          <h3>Today, focus on…</h3>
          <div className="row"><span className="label">3 coding problems</span><span className="meta">Practice</span></div>
          <div className="row"><span className="label">1 reading task</span><span className="meta">Learn</span></div>
          <div className="row"><span className="label">1 mock review</span><span className="meta">Community</span></div>
        </section>
      </div>

      <section className="dash-card" aria-label="Mock code editor">
        <h3>Try the editor</h3>
        <p style={{ marginTop: 0, color: 'var(--surface-fg-muted)', fontSize: 13 }}>
          Demo-only — this is a styled textarea, not the real Monaco. Run it to see cosmetic output.
        </p>
        <MockMonaco />
      </section>
    </div>
  );
}

function ViewPlaceholder({ title, message }) {
  return (
    <div className="dash-content">
      <div className="dash-empty">
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const toast = useToast();

  const [profile, setProfile] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem('vericode_profile');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  });

  const [activeView, setActiveView] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth gate ------------------------------------------------------------
  useEffect(() => {
    if (!profile) {
      navigate('/login');
    }
  }, [profile, navigate]);

  // Light-mode welcome --------------------------------------------------
  // Because this is the first screen authenticated users see, fire a small
  // welcome toast so the new features (toast system) are visible.
  useEffect(() => {
    if (profile) {
      const greetKey = `vericode_greeted_${profile.username || 'guest'}`;
      try {
        if (!window.sessionStorage.getItem(greetKey)) {
          toast.success(
            `Signed in as ${profile.name || profile.username || 'guest'}. Welcome back.`,
            { title: 'You are in' }
          );
          window.sessionStorage.setItem(greetKey, '1');
        }
      } catch (_) {
        // sessionStorage disabled — skip greeting silently
      }
    }
    // Run only when the profile resolves the first time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.username]);

  // Listen for sidebar navigation events sent from Profile() to keep the
  // view in sync without coupling the sidebar to state directly.
  useEffect(() => {
    function onNavigate(event) {
      const next = event.detail || 'dashboard';
      setActiveView(next);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      setMobileOpen(false);
    }
    document.documentElement.addEventListener('dashboard:navigate', onNavigate);
    return () => document.documentElement.removeEventListener('dashboard:navigate', onNavigate);
  }, []);

  // Mobile sidebar overlay --------------------------------------------
  useEffect(() => {
    document.documentElement.dataset.dashMobileOpen = mobileOpen ? 'true' : 'false';
    return () => {
      delete document.documentElement.dataset.dashMobileOpen;
    };
  }, [mobileOpen]);

  function handleSignOut() {
    try {
      window.localStorage.removeItem('vericode_profile');
      window.localStorage.removeItem('vericode_chat_identity');
    } catch (_) {
      // ignore storage errors
    }
    toast.info('Signed out. See you soon.', { title: 'Signed out' });
    setProfile(null);
    setTimeout(() => navigate('/login'), 600);
  }

  // Theme-aware logo swap (white logo for dark, black logo for light).
  const logoSrc = theme === 'light' ? '/logo_black.png' : '/logo_white.jpg';

  if (!profile) return null;

  return (
    <div className={`dash-page${mobileOpen ? ' has-mobile-overlay' : ''}`}>
      <Profile profile={profile} onSignOut={handleSignOut} />

      <div className="dash-main">
        <div className="dash-mobile-topbar">
          <button
            type="button"
            className="dash-mobile-sidebar-toggle"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle sidebar"
            aria-expanded={mobileOpen}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="mobile-brand">VERICODE AI</span>
          <img src={logoSrc} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
        </div>

        {activeView === 'dashboard' ? <ViewDashboard profile={profile} /> : null}

        {activeView === 'learning' ? (
          <ViewPlaceholder
            title="Learning lives in its own space"
            message="Open the Learn tab to keep your course progress tidy. We'll deep-link from there once you click it below."
          />
        ) : null}

        {activeView === 'practice' ? (
          <ViewPlaceholder
            title="Practice view"
            message="The full problem set lives under /practice. Use the link below to jump there with your session intact."
          />
        ) : null}

        {activeView === 'projects' ? (
          <ViewPlaceholder
            title="Project ideas"
            message="Project ideas are coming soon. For now, head to /learn to keep working through the curriculum."
          />
        ) : null}

        {activeView === 'ai-assistant' ? (
          <ViewPlaceholder
            title="AI Assistant"
            message="The real chat lives under the Practice tab once you open a problem. This slot is reserved for the next iteration."
          />
        ) : null}

        {activeView === 'leaderboard' ? (
          <ViewPlaceholder
            title="Leaderboard"
            message="The live ranking table opens in the full screen. From here you can preview your rank (#42) and weekly delta."
          />
        ) : null}

        {activeView === 'community' ? (
          <ViewPlaceholder
            title="Community"
            message="Active rooms show up in the full workspace. This dashboard slot is intentionally lightweight."
          />
        ) : null}

        {activeView === 'settings' ? (
          <ViewPlaceholder
            title="Settings"
            message="Profile, notifications, and security controls live under /settings. We're wiring that screen next."
          />
        ) : null}
      </div>
    </div>
  );
}

export default Dashboard;
