"use client";

import { useEffect, useState } from "react";
import { openAsk } from "./ask";

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

// tmux-style status line along the bottom edge. The prompt shows the current section as a directory.
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

  const dir = links.find((l) => l.href === active)?.label.toLowerCase();

  return (
    <nav className="nav" aria-label="Sections">
      <p className="nav__prompt" aria-hidden="true">
        nb@portfolio:<span>~{dir && `/${dir}`}</span>$
      </p>
      <ul className="nav__list">
        {links.map((s) => (
          <li key={s.href}>
            <a className="nav__link" href={s.href} aria-current={active === s.href ? "true" : undefined}>
              {s.label}
            </a>
          </li>
        ))}
      </ul>
      <button type="button" className="nav__ask" onClick={openAsk} aria-haspopup="dialog" aria-controls="ask">
        Ask me
      </button>
      {/* Names the mode it switches to; CSS shows the one for the other mode. */}
      <button type="button" className="nav__theme" onClick={toggleTheme} aria-label="Switch light or dark theme">
        <span className="nav__mode nav__mode--dark">dark</span>
        <span className="nav__mode nav__mode--light">light</span>
      </button>
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
