"use client";

import { useEffect, useState, type CSSProperties } from "react";

type NavLink = { href: string; label: string };

// Which nav link each section lights up. Education and Experience both live under "Background".
const owner: Record<string, string | null> = {
  about: null,
  education: "#education",
  experience: "#education",
  work: "#work",
  contact: "#contact",
};

// Flips the effective theme and remembers it. The inline script in layout.tsx re-applies it on load.
function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Storage blocked (private mode etc.): the switch still works for this visit.
  }
}

export function Nav({ links }: { links: NavLink[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // A 1% band at 60% of the viewport height: whichever section crosses it is current.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(owner[e.target.id] ?? null);
      },
      { rootMargin: "-60% 0px -39% 0px" },
    );
    for (const id of Object.keys(owner)) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  // At the top of the page the items sit spread out; scrolling gathers them (see .nav in globals.css).
  // --dx is each item's spread offset, measured from the middle item.
  const mid = links.length / 2;
  const spread = (i: number) => ({ "--dx": `${(i - mid) * 0.75}rem` }) as CSSProperties;

  return (
    <nav className="nav" aria-label="Sections">
      <button
        type="button"
        className="nav__theme"
        onClick={toggleTheme}
        aria-label="Switch light or dark theme"
        style={spread(0)}
      >
        {/* Lucide "sun" + "moon" (ISC); CSS shows the one for the other mode. */}
        <svg className="nav__icon nav__icon--sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
        <svg className="nav__icon nav__icon--moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
        </svg>
      </button>
      <ul className="nav__list">
        {links.map((s, i) => (
          <li key={s.href}>
            <a
              className="nav__link"
              href={s.href}
              aria-current={active === s.href ? "true" : undefined}
              style={spread(i + 1)}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Sets data-inview on the element with this id the first time half of it is on screen.
// CSS keys its one-shot animation off that attribute; without JS the element just stays static.
export function InViewFlag({ id }: { id: string }) {
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.inview = "";
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id]);
  return null;
}
