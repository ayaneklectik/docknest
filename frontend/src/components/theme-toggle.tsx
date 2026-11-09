"use client";

import { useEffect } from "react";

export function ThemeToggle() {
  useEffect(() => {
    const saved = window.localStorage.getItem("docknest-theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.dataset.theme = saved;
    }
  }, []);

  function toggleTheme() {
    const current = document.documentElement.dataset.theme ?? "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("docknest-theme", next);
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle light and dark mode"
      title="Toggle light and dark mode"
    >
      <span aria-hidden="true">◐</span>
    </button>
  );
}
