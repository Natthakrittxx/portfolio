"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { askSuggestions } from "./content";

// Backend contract (app/api/ask/route.ts): POST /api/ask with JSON
//   { messages: { role: "user" | "assistant"; content: string }[] }   // oldest first, last is the new question
// and reply 200 with the answer as plain text. Stream it chunk by chunk and it renders as it arrives;
// a single whole body works too. 429 shows its body as the answer; any other non-2xx shows the error under the question.
type Turn = { q: string; a: string; status: "pending" | "done" | "error"; error?: string };

// Shown to visitors while /api/ask doesn't exist (404).
const NOT_LIVE = "Answers aren’t switched on yet. Use the contact links at the bottom of the page meanwhile.";

// Called by the nav's Ask me button. Desktop focuses the question box; phones don't, so the keyboard
// doesn't cover the panel before it has been read.
export function openAsk() {
  (document.getElementById("ask") as HTMLDialogElement | null)?.showModal();
  if (matchMedia("(pointer: fine)").matches) document.getElementById("ask-input")?.focus();
}

// Native modal <dialog>: Esc, focus trap and focus return come from the browser. The conversation
// lives here, so closing and reopening keeps it.
export function AskDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const busy = turns.at(-1)?.status === "pending";

  const close = () => dialog.current?.close();
  const toBottom = () => body.current?.scrollTo({ top: body.current.scrollHeight });

  // A new question scrolls the conversation to its end.
  useEffect(() => {
    if (turns.length) toBottom();
  }, [turns.length]);

  // `retry` is the index of a failed turn to replace instead of appending a new one.
  async function send(text: string, retry?: number) {
    const q = text.trim();
    if (!q || busy) return;

    const base = retry === undefined ? turns : turns.filter((_, j) => j !== retry);
    const i = base.length;
    const edit = (f: (t: Turn) => Turn) => setTurns((ts) => ts.map((t, j) => (j === i ? f(t) : t)));
    const fail = (error: string) => edit((t) => ({ ...t, status: "error", error }));

    setTurns([...base, { q, a: "", status: "pending" }]);
    setDraft("");

    // Earlier answered turns go along so follow-up questions have context.
    const messages = base
      .filter((t) => t.status === "done")
      .flatMap((t) => [
        { role: "user", content: t.q },
        { role: "assistant", content: t.a },
      ])
      .concat({ role: "user", content: q });

    let res: Response;
    try {
      res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
    } catch {
      return fail("Couldn’t reach the answer service. Check your connection and try again.");
    }
    if (res.status === 404) return fail(NOT_LIVE);
    // Rate limited: the server's message is the answer.
    if (res.status === 429) {
      const a = await res.text();
      return edit((t) => ({ ...t, a, status: "done" }));
    }
    if (!res.ok || !res.body) return fail(`The answer service returned an error (${res.status}). Try again.`);

    try {
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        // Follow the answer down only if the reader is already at the end.
        const el = body.current;
        const atEnd = !el || el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
        edit((t) => ({ ...t, a: t.a + value }));
        if (atEnd) requestAnimationFrame(toBottom);
      }
      edit((t) => ({ ...t, status: "done" }));
    } catch {
      fail("The answer stopped part-way. Try again.");
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(draft);
  }

  // Enter sends, Shift+Enter adds a line. Skipped mid-composition so Thai / CJK input methods work.
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(draft);
    }
  }

  return (
    <dialog
      ref={dialog}
      id="ask"
      className="ask"
      aria-labelledby="ask-title"
      // The panel fills the dialog, so a click landing on the dialog itself is a click on the backdrop.
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="ask__panel">
        <header className="ask__head">
          <h2 id="ask-title">Ask about my work</h2>
          <button type="button" className="ask__close" onClick={close} aria-label="Close">
            [x]
          </button>
          <p>
            An LLM answers on my behalf and can get things wrong. For anything important,{" "}
            <a href="#contact" onClick={close}>
              contact me directly
            </a>
            .
          </p>
        </header>

        <div ref={body} className="ask__body">
          {turns.length ? (
            <div className="ask__log" role="log" aria-label="Conversation" aria-busy={busy}>
              {turns.map((t, i) => (
                <div key={i} className="turn">
                  <p className="turn__q">
                    <span className="sr-only">You asked: </span>
                    {t.q}
                  </p>
                  {(t.a || t.status === "pending") && (
                    <p className="turn__a">
                      <span className="sr-only">Answer: </span>
                      {t.a}
                      {t.status === "pending" && <span className="term__caret" aria-hidden="true" />}
                    </p>
                  )}
                  {t.status === "error" && (
                    <div className="turn__error">
                      <p>{t.error}</p>
                      {t.error !== NOT_LIVE && (
                        <button type="button" className="link" onClick={() => send(t.q, i)} disabled={busy}>
                          <span className="link__label">Try again</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <ul className="ask__try" aria-label="Suggested questions">
              {askSuggestions.map((s) => (
                <li key={s}>
                  <button type="button" onClick={() => send(s)}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="ask__form" onSubmit={onSubmit}>
          <label htmlFor="ask-input" className="sr-only">
            Your question
          </label>
          <textarea
            id="ask-input"
            className="ask__input"
            rows={1}
            maxLength={1000}
            placeholder="Type a question"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="submit" className="ask__send" disabled={busy || !draft.trim()}>
            {busy ? "Answering…" : "Ask"}
          </button>
        </form>
      </div>
    </dialog>
  );
}
