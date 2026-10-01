import type { CSSProperties } from "react";
import {
  contact,
  education,
  experience,
  meta,
  moreProjects,
  person,
  projects,
  research,
  skills,
  type Entry,
  type Link,
} from "./content";
import { InViewFlag, Nav } from "./client";
import { BubbleTrail } from "./bubble-trail";
import { brandIcons } from "./icons";

const sections = [
  { href: "#education", label: "Background" },
  { href: "#work", label: "Work" },
  { href: "#contact", label: "Contact" },
];

function BrandIcon({ name, className }: { name: string; className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={brandIcons[name]} fill="currentColor" />
    </svg>
  );
}

// Motion timelines, in ms. `at` hands the delay to CSS as --t.
const at = (ms: number) => ({ "--t": `${ms}ms` }) as CSSProperties;
// Hero: typed on load. Chars appear one by one (every *Step ms); command output appears whole.
// Tune speed here: raise whoamiStep / catStep to type slower, then shift the later start times.
const HERO = {
  whoami: 200,
  whoamiStep: 90,
  name: 900,
  cat: 1300,
  catStep: 70,
  out: 2500,
  outStep: 120,
  idle: 3050,
};
// Fig. 1: runs once when the figure is half on screen.
const GATE = { input: 90, wire1: 540, hold: 760, wire2: 880, dwell: 1100, wire3: 1220, alert: 1440 };
// Contact: runs once when the footer is half on screen. Rows print one after another; each handle types out.
const CONTACT = { row: 160, handle: 120, step: 24 };

function Typed({ text, start, step }: { text: string; start: number; step: number }) {
  return (
    <>
      {[...text].map((ch, i) => (
        <span key={i} className="type-char" style={at(start + i * step)}>
          {ch}
        </span>
      ))}
    </>
  );
}

function Timeline({ items }: { items: Entry[] }) {
  return (
    <ol className="timeline__list">
      {items.map((e) => (
        <li key={e.org + e.when} className="dated">
          <p className="dated__when">{e.when}</p>
          <div className="dated__body">
            <h3>{e.org}</h3>
            <p className="dated__title">{e.title}</p>
            {e.facts && (
              <dl className="dated__facts">
                {e.facts.map((f) => (
                  <div key={f.key}>
                    <dt>{f.key}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {e.points && (
              <ul>
                {e.points.map((pt) => (
                  <li key={pt.text}>
                    {pt.lead && <strong>{pt.lead} </strong>}
                    {pt.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function OutLink({ link }: { link: Link }) {
  const icon = brandIcons[link.label];
  return (
    <a className="link" href={link.href}>
      {icon && <BrandIcon name={link.label} className="link__icon" />}
      <span className="link__label">{link.label}</span>
      {!icon && <span aria-hidden="true">↗</span>}
    </a>
  );
}

export default function Home() {
  return (
    <>
      <Nav links={sections} />

      <main>
        <section id="about" className="section hero" aria-label="About">
          <BubbleTrail />
          <div className="hero__who">
            <p className="term__line" aria-hidden="true">
              <span className="term__prompt">$</span> <Typed text="whoami" start={HERO.whoami} step={HERO.whoamiStep} />
            </p>
            <h1 className="hero__name type-out" style={at(HERO.name)}>
              <span>{person.nameFirst}</span>
              <span>{person.nameLast}</span>
            </h1>
          </div>
          <div className="hero__foot">
            <p className="hero__zh type-out" lang="zh" style={at(HERO.name)}>
              {person.nameZh}
            </p>
            <div className="term">
              <p className="term__line type-out" aria-hidden="true" style={at(HERO.cat - 80)}>
                <span className="term__prompt">$</span> <Typed text="cat profile.yml" start={HERO.cat} step={HERO.catStep} />
              </p>
              <dl className="term__out">
                {meta.map((m, i) => (
                  <div key={m.key}>
                    <dt className="type-out" style={at(HERO.out + i * HERO.outStep)}>
                      <span aria-hidden="true">{m.key.toLowerCase().replace(/\s+/g, "_")}:</span>
                      <span className="sr-only">{m.key}</span>
                    </dt>
                    <dd className="type-out" style={at(HERO.out + i * HERO.outStep)}>
                      {m.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="term__line type-out" aria-hidden="true" style={at(HERO.idle)}>
                <span className="term__prompt">$</span> <span className="term__caret" />
              </p>
            </div>
          </div>
        </section>

        <section id="education" className="section timeline" aria-labelledby="edu-title">
          <header className="head-hang">
            <h2 id="edu-title">Education</h2>
          </header>
          <Timeline items={education} />
        </section>

        <section id="experience" className="section timeline" aria-labelledby="exp-title">
          <header className="head-hang">
            <h2 id="exp-title">Experience</h2>
          </header>
          <Timeline items={experience} />
          {/* Endless sideways strip. The list renders twice so the loop has no seam; screen readers get it once.
              Hover or keyboard focus (tap on most phones) pauses it. */}
          <div className="marquee" tabIndex={0} role="region" aria-label="Skills (hover or focus to pause)">
            <div className="marquee__track">
              {[0, 1].map((copy) => (
                <ul key={copy} className="marquee__group" aria-hidden={copy === 1 ? true : undefined}>
                  {skills.map((name) => (
                    <li key={name} className="skill">
                      <BrandIcon name={name} className="skill__icon" />
                      {name}
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>

        <section id="work" className="section work" aria-labelledby="work-title">
          <header className="head-hang">
            <h2 id="work-title">Work</h2>
            <p>One research write-up, two live projects, and three more builds.</p>
          </header>

          <article className="research" aria-labelledby="research-title">
            <div className="research__text">
              <p className="tag tag--research">Research · {research.status}</p>
              <h3 id="research-title">{research.title}</h3>
              <p className="research__lead">{research.question}</p>
              <p>{research.method}</p>
            </div>

            <figure id="gate" className="gate" aria-labelledby="gate-caption">
              <div className="gate__flow">
                <ol className="gate__inputs">
                  {research.conditions.map((c, i) => (
                    <li key={c} style={at(i * GATE.input)}>
                      {c}
                    </li>
                  ))}
                  <li className="is-open" style={at(research.conditions.length * GATE.input)}>
                    {research.openCondition}
                    <span className="gate__note">under test</span>
                  </li>
                </ol>
                <span className="gate__wire" aria-hidden="true" style={at(GATE.wire1)} />
                <p className="gate__node" style={at(GATE.hold)}>
                  All five hold
                </p>
                <span className="gate__wire" aria-hidden="true" style={at(GATE.wire2)} />
                <p className="gate__node" style={at(GATE.dwell)}>
                  Held for the dwell time
                </p>
                <span className="gate__wire" aria-hidden="true" style={at(GATE.wire3)} />
                <p className="gate__node gate__node--out" style={at(GATE.alert)}>
                  Alert fires
                </p>
              </div>
              <figcaption id="gate-caption">
                Fig. 1 — The alert gate. Every input must hold at the same time, for the whole dwell time. The dashed
                input is still under test and may be dropped.
              </figcaption>
            </figure>
            <InViewFlag id="gate" />

            <dl className="facts">
              {research.facts.map((f) => (
                <div key={f.key}>
                  <dt>{f.key}</dt>
                  <dd className={f.mono ? "mono" : undefined}>{f.value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <div className="projects">
            {projects.map((p) => (
              <article key={p.id} className="card" aria-labelledby={`${p.id}-title`}>
                <p className="tag">Project · {p.tag}</p>
                <h3 id={`${p.id}-title`}>{p.title}</h3>
                <p className="card__task">{p.task}</p>
                <dl className="card__facts">
                  {p.facts.map((f) => (
                    <div key={f.key}>
                      <dt>{f.key}</dt>
                      <dd className={f.mono ? "mono" : undefined}>{f.value}</dd>
                    </div>
                  ))}
                </dl>
                <ul className="card__links">
                  {p.links.map((l) => (
                    <li key={l.href}>
                      <OutLink link={l} />
                      {l.note && <span className="note">{l.note}</span>}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="more">
            <h3 className="more__title">More projects</h3>
            <ul className="more__list">
              {moreProjects.map((m) => (
                <li key={m.title} className="more__row">
                  <p className="more__year">{m.year}</p>
                  <div className="more__body">
                    <h4>{m.title}</h4>
                    <p>{m.text}</p>
                  </div>
                  <p className="mono more__stack">{m.stack}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

      </main>

      <footer id="contact" className="section foot">
        <h2 className="foot__line">Find the code on GitHub, or say hello.</h2>
        {/* Index rows: the whole row is the link; the handle is visible so it can be read or copied. */}
        <ul className="foot__links">
          {contact.map((l, i) => (
            <li key={l.href}>
              <a className="foot__row type-out" href={l.href} style={at(i * CONTACT.row)}>
                <BrandIcon name={l.label} className="foot__icon" />
                <span className="foot__label">{l.label}</span>
                <span className="foot__handle">
                  <Typed text={l.handle ?? ""} start={i * CONTACT.row + CONTACT.handle} step={CONTACT.step} />
                </span>
                <span className="foot__arrow" aria-hidden="true">
                  {l.href.startsWith("mailto:") ? "→" : "↗"}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="foot__meta">
          <span className="wordmark">N.B.</span>
          <span>© 2026 {person.nameFirst} {person.nameLast}</span>
          <a className="foot__readme" href="/README.md">
            Revision log (README)
          </a>
        </p>
        <InViewFlag id="contact" />
      </footer>
    </>
  );
}
