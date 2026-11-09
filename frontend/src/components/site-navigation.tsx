"use client";

import Link from "next/link";
import { useRef, useState, type FocusEvent, type PointerEvent } from "react";

type NavigationLink = {
  href: string;
  label: string;
};

type GlassPosition = {
  left: number;
  width: number;
};

export function SiteNavigation({ links }: { links: NavigationLink[] }) {
  const navRef = useRef<HTMLElement>(null);
  const [glassPosition, setGlassPosition] = useState<GlassPosition | null>(null);

  function moveGlass(link: HTMLAnchorElement) {
    const nav = navRef.current;
    if (!nav) return;

    const navBounds = nav.getBoundingClientRect();
    const linkBounds = link.getBoundingClientRect();
    setGlassPosition({
      left: linkBounds.left - navBounds.left,
      width: linkBounds.width
    });
  }

  function handlePointerEnter(event: PointerEvent<HTMLAnchorElement>) {
    moveGlass(event.currentTarget);
  }

  function handleFocus(event: FocusEvent<HTMLAnchorElement>) {
    moveGlass(event.currentTarget);
  }

  return (
    <nav
      aria-label="Main navigation"
      className="desktop-nav"
      onPointerLeave={() => setGlassPosition(null)}
      ref={navRef}
    >
      <span
        aria-hidden="true"
        className={`nav-glass-pill${glassPosition ? " is-visible" : ""}`}
        style={glassPosition ? {
          transform: `translateX(${glassPosition.left}px)`,
          width: glassPosition.width
        } : undefined}
      />
      {links.map((link) => (
        <Link
          href={link.href}
          key={link.href}
          onFocus={handleFocus}
          onPointerEnter={handlePointerEnter}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
