"use client";

import type { PointerEvent } from "react";

function updateTilt(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== "mouse") return;

  const stage = event.currentTarget;
  const bounds = stage.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;

  stage.style.setProperty("--pointer-x", `${x * 100}%`);
  stage.style.setProperty("--pointer-y", `${y * 100}%`);
  stage.style.setProperty("--pointer-tilt-x", `${(0.5 - y) * 5}deg`);
  stage.style.setProperty("--pointer-tilt-y", `${(x - 0.5) * 8}deg`);
}

function resetTilt(event: PointerEvent<HTMLDivElement>) {
  const stage = event.currentTarget;
  stage.style.removeProperty("--pointer-x");
  stage.style.removeProperty("--pointer-y");
  stage.style.removeProperty("--pointer-tilt-x");
  stage.style.removeProperty("--pointer-tilt-y");
}

export function HeroDashboard() {
  return (
    <div
      className="hero-dashboard-stage"
      onPointerLeave={resetTilt}
      onPointerMove={updateTilt}
    >
      <div className="hero-dashboard" aria-label="Illustration of Docknest services working together">
        <aside className="hero-dashboard-sidebar">
          <span className="hero-dashboard-mark">d.</span>
          <span className="hero-dashboard-nav-item hero-dashboard-nav-active"><i>◫</i> Overview</span>
          <span className="hero-dashboard-nav-item"><i>⌘</i> Hosting</span>
          <span className="hero-dashboard-nav-item"><i>▧</i> Website</span>
          <span className="hero-dashboard-nav-item"><i>↗</i> Domains</span>
          <span className="hero-dashboard-nav-item"><i>○</i> Support</span>
          <span className="hero-dashboard-sidebar-foot">ONE PARTNER<br />FROM HERE ON</span>
        </aside>
        <div className="hero-dashboard-content">
          <div className="hero-dashboard-topbar">
            <span>DOCKNEST <i>/</i> YOUR DIGITAL FOUNDATION</span>
            <span className="hero-dashboard-label">A TYPICAL PROJECT</span>
          </div>
          <div className="hero-dashboard-heading">
            <div><span className="section-kicker">A CLEAR PATH FORWARD</span><h2>From the first idea<br />to <em>what comes next.</em></h2></div>
            <span className="hero-dashboard-index">01 — 04</span>
          </div>
          <div className="hero-dashboard-grid">
            <div className="hero-dashboard-card hero-dashboard-site">
              <div className="hero-dashboard-card-top"><span>01 / DIGITAL CRAFT</span><b>↗</b></div>
              <div className="hero-site-preview">
                <span>YOUR BRAND, ONLINE</span>
                <strong>A place to<br />move people.</strong>
                <i /><i />
                <b>EXPLORE THE SITE <span>↗</span></b>
                <div className="hero-site-art"><i /><i /><b /></div>
              </div>
            </div>
            <div className="hero-dashboard-stack">
              <div className="hero-dashboard-card">
                <div className="hero-dashboard-card-top"><span>02 / INFRASTRUCTURE</span><b>↗</b></div>
                <h3>Hosting that holds steady.</h3>
                <p>A dependable home for your website, set up around your needs.</p>
                <div className="hero-server-art" aria-hidden="true"><i /><i /><i /></div>
              </div>
              <div className="hero-dashboard-card hero-dashboard-domain">
                <div className="hero-dashboard-card-top"><span>03 / YOUR CORNER OF THE WEB</span><b>↗</b></div>
                <h3>A name to build on.</h3>
                <div className="hero-domain-art" aria-hidden="true"><span>youridea</span><b>.com</b><i>⌕</i></div>
              </div>
            </div>
            <div className="hero-dashboard-support">
              <span className="hero-support-avatar">d.</span>
              <div><b>Real people, still here.</b><span>Practical help as you grow.</span></div>
              <span className="hero-support-arrow">↗</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
