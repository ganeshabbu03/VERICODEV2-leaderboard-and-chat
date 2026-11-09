import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companyData } from '../company-data.js';

// Dedicated /team route — the focus here is depth: full bios, photos,
// contact paths, an "open roles" CTA, and a small "by the numbers" band.
// We re-use the leadership / engineering data already declared in the
// landing page so both surfaces stay in sync.

function RevealOnScroll({ as: As = 'div', className = '', children, ...rest }) {
  const ref = React.useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <As ref={ref} className={`reveal-on-scroll ${className}`.trim()} {...rest}>
      {children}
    </As>
  );
}

function MemberCard({ member, featured }) {
  return (
    <RevealOnScroll as="article" className={`tp-card${featured ? ' featured' : ''}`}>
      <div className="avatar" aria-hidden="true">
        {member.photo
          ? <img src={member.photo} alt="" />
          : <span>{member.initials || (member.name ? member.name.slice(0, 2).toUpperCase() : 'VC')}</span>}
      </div>
      <span className="role-pill">{member.role}</span>
      <h3>{member.name}</h3>
      <span className="tenure">{member.tenure}</span>
      <p>{member.bio}</p>
      <div className="links">
        {member.links?.linkedin ? (
          <a href={member.links.linkedin} aria-label={`${member.name} on LinkedIn`}>in</a>
        ) : null}
        {member.links?.x ? (
          <a href={member.links.x} aria-label={`${member.name} on X`}>X</a>
        ) : null}
        {member.links?.email ? (
          <a href={member.links.email} aria-label={`Email ${member.name}`}>@</a>
        ) : null}
      </div>
    </RevealOnScroll>
  );
}

function Stat({ value, label }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Team() {
  useEffect(() => {
    document.title = 'Team — Vericode AI';
  }, []);

  const { leadership, engineering } = companyData.team;

  return (
    <div className="tp-page">
      <nav className="tp-nav" aria-label="Page navigation">
        <Link to="/" className="logo-container" title="Vericode AI">
          <img src="/logo_white.jpg" alt="" className="logo-img" />
          <span className="logo-text">VERICODE AI</span>
        </Link>
        <Link to="/" className="tp-back">
          <span aria-hidden="true">←</span> Back to home
        </Link>
      </nav>

      <header className="tp-hero">
        <div className="eyebrow">The team behind Vericode AI</div>
        <h1>Small team. Real ownership.</h1>
        <p>
          Founders, engineers, and the operations people who keep the trains
          running. Every name you see on the product is somewhere on this
          page. No contractors hiding behind copy.
        </p>

        <RevealOnScroll className="tp-stats">
          <Stat value={String(leadership.length + engineering.length)} label="People" />
          <Stat value="4" label="Time zones" />
          <Stat value="2025" label="Year founded" />
        </RevealOnScroll>
      </header>

      <section className="tp-grid-section" aria-labelledby="tp-leadership">
        <div className="tier-label">
          <span className="line" />
          <span id="tp-leadership" className="name">Leadership</span>
          <span className="line" />
        </div>
        <div className="tp-grid leadership">
          {leadership.map((member) => (
            <MemberCard key={member.id} member={member} featured />
          ))}
        </div>
      </section>

      <section className="tp-grid-section" aria-labelledby="tp-engineering">
        <div className="tier-label">
          <span className="line" />
          <span id="tp-engineering" className="name">Engineering</span>
          <span className="line" />
        </div>
        <div className="tp-grid engineering">
          {engineering.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </section>

      <RevealOnScroll as="section" className="tp-cta">
        <h2>Want to build with us?</h2>
        <p>
          We hire slowly and trust a lot. If working on a focused developer
          tool with a small, opinionated team sounds like your kind of thing,
          reach out — we read every email.
        </p>
        <a href="mailto:hello@vericode.ai">Say hello@vericode.ai</a>
      </RevealOnScroll>
    </div>
  );
}

export default Team;
