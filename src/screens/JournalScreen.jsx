import { useCallback, useEffect, useMemo, useState } from "react";
import GhostButton from "../components/ui/GhostButton";
import PrimaryButton from "../components/ui/PrimaryButton";
import { MOCK_USER_ID, isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseEntryDate(entryOrIso) {
  if (typeof entryOrIso === "string") {
    const parsed = new Date(entryOrIso);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  if (entryOrIso?.date) {
    const parsed = new Date(entryOrIso.date);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  if (entryOrIso?.written_at) {
    const parsed = new Date(entryOrIso.written_at);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  if (entryOrIso?.dateLabel) {
    const parsed = new Date(`${entryOrIso.dateLabel}, ${new Date().getFullYear()}`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  return new Date();
}

function fmtLong(iso) {
  const d = parseEntryDate(iso);
  return MONTHS_LONG[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

function fmtShort(iso) {
  const d = parseEntryDate(iso);
  const today = new Date();

  if (d.toDateString() === today.toDateString()) {
    return "Today, " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    MONTHS_SHORT[d.getMonth()] +
    " " +
    d.getDate() +
    ", " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function wordCount(text) {
  return text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
}

function entryTitle(entry) {
  return entry?.title || "Untitled Entry";
}

function entryContent(entry) {
  return entry?.content || (Array.isArray(entry?.body) ? entry.body.join("\n\n") : entry?.body || entry?.firstSentence || "");
}

function entryParagraphs(entry) {
  if (Array.isArray(entry?.body) && entry.body.length > 0) return entry.body;
  return entryContent(entry)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function criticalPathItems(criticalPath) {
  if (!criticalPath) return [];
  return Array.isArray(criticalPath) ? criticalPath : [criticalPath];
}

function JournalEntryForm({ onCancel, onSave }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      title: title.trim() || "Untitled Entry",
      content: content.trim(),
      body: content
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    });
  }

  return (
    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
      <input
        className="mb-6 w-full border-0 border-b border-outline-variant/20 bg-transparent pb-4 font-headline-md text-headline-md text-on-surface outline-none placeholder:text-on-surface-variant/60 focus:border-primary/60"
        placeholder="Entry title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <textarea
        className="min-h-[320px] flex-1 resize-none border-0 bg-transparent font-body-lg text-body-lg leading-relaxed text-on-surface/90 outline-none placeholder:text-on-surface-variant/60"
        placeholder="Write your entry..."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="mt-8 flex items-center justify-end gap-3 border-t border-outline-variant/20 pt-6">
        <GhostButton onClick={onCancel}>Cancel</GhostButton>
        <PrimaryButton className="w-auto px-5 py-2" onClick={handleSubmit}>
          Save
        </PrimaryButton>
      </div>
    </form>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[0, 1, 2].map((item) => (
        <div className="h-28 animate-pulse rounded-lg bg-white/10" key={item} />
      ))}
    </div>
  );
}

function ErrorCard({ onRetry }) {
  return (
    <button
      className="m-6 rounded-xl border border-error/60 bg-error/10 p-6 text-left font-body-md text-body-md text-error"
      onClick={onRetry}
      type="button"
    >
      Failed to load. Tap to retry.
    </button>
  );
}

function CriticalPath({ items }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-8 rounded-lg border border-l-4 border-white/20 border-l-secondary bg-surface-variant/30 p-6">
      <p className="mb-2 font-label-caps text-label-caps text-secondary">CRITICAL PATH</p>
      <ul className="space-y-2">
        {items.map((item, index) => {
          const completed = typeof item === "object" ? Boolean(item.completed) : false;
          const label = typeof item === "object" ? item.label || item.title || item.text : item;

          return (
            <li className="flex items-start gap-2 font-body-md text-body-md text-on-surface-variant" key={`${label}-${index}`}>
              <span
                className={`material-symbols-outlined mt-0.5 text-[18px] ${
                  completed ? "text-secondary" : "text-on-surface-variant"
                }`}
              >
                {completed ? "check_circle" : "radio_button_unchecked"}
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const selectedEntry = entries.find((entry) => entry.id === selectedId);
  const todayLabel = useMemo(() => fmtLong(new Date().toISOString()), []);
  const paragraphs = entryParagraphs(selectedEntry);
  const selectedContent = entryContent(selectedEntry);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setError(new Error("Supabase is not configured."));
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", MOCK_USER_ID)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setEntries(data || []);
    setSelectedId((current) => {
      if (current && data?.some((entry) => entry.id === current)) return current;
      return data?.[0]?.id ?? null;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  async function handleSave(newEntry) {
    const now = new Date();
    const { data, error: insertError } = await supabase
      .from("journal_entries")
      .insert({
        user_id: MOCK_USER_ID,
        weekday: now.toLocaleDateString("en-US", { weekday: "long" }),
        day: String(now.getDate()).padStart(2, "0"),
        month: MONTHS_SHORT[now.getMonth()],
        mood: null,
        mood_tone: null,
        title: newEntry.title,
        body: newEntry.content,
        written_at: now.toISOString(),
        tags: [],
      })
      .select("*")
      .single();

    if (insertError) {
      setError(insertError);
      return;
    }

    setSelectedId(data.id);
    setShowNewForm(false);
    fetchEntries();
  }

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col gap-gutter overflow-hidden bg-background p-margin-mobile md:p-margin-desktop">
      <header className="mb-4 hidden h-header_height items-center justify-between md:flex">
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-label-caps text-on-surface-variant">ROOT</span>
          <span className="text-sm text-on-surface-variant">/</span>
          <span className="font-label-caps text-label-caps text-primary">JOURNAL</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-data-md text-data-md text-on-surface-variant">{todayLabel}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-surface-variant font-label-caps text-label-caps text-on-surface-variant">
            OS
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-gutter overflow-hidden lg:flex-row">
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/20 bg-[#1A1A1A] lg:w-1/2 lg:flex-1">
          <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-high/50 p-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">Entries</h2>
            <span className="rounded-full border border-white/20 bg-surface px-3 py-1 font-data-md text-data-md text-on-surface-variant">
              {entries.length} Total
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <ErrorCard onRetry={fetchEntries} />
            ) : (
              entries.map((entry) => {
              const selected = entry.id === selectedId && !showNewForm;
              const preview = entry.firstSentence || entryContent(entry);

              return (
                <article
                  className={`list-border cursor-pointer border-b border-white/10 p-6 transition-colors ${
                    selected
                      ? "border-l-2 border-l-primary bg-surface-variant/20 hover:bg-surface-variant/30"
                      : "hover:bg-surface-variant/10"
                  }`}
                  key={entry.id}
                  onClick={() => {
                    setSelectedId(entry.id);
                    setShowNewForm(false);
                  }}
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <h3 className={`font-headline-md text-headline-md text-on-surface ${selected ? "" : "opacity-80"}`}>
                      {entryTitle(entry)}
                    </h3>
                    <span
                      className={`shrink-0 font-data-md text-data-md ${
                        selected ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {fmtShort(entry.date || entry)}
                    </span>
                  </div>
                  <p
                    className={`line-clamp-2 font-body-sm text-body-sm text-on-surface-variant ${
                      selected ? "" : "opacity-70"
                    }`}
                  >
                  {preview}
                </p>
              </article>
              );
              })
            )}
          </div>

          <div className="border-t border-outline-variant/20 bg-surface-container-high/50 p-6">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary bg-transparent py-3 font-label-caps text-label-caps text-secondary transition-colors hover:bg-secondary/10"
              type="button"
              onClick={() => setShowNewForm(true)}
            >
              <span className="material-symbols-outlined text-[18px]">edit_document</span>
              + NEW ENTRY
            </button>
          </div>
        </section>

        <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/20 bg-[#1A1A1A] lg:w-1/2 lg:flex-1">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto p-8">
            {showNewForm ? (
              <JournalEntryForm onCancel={() => setShowNewForm(false)} onSave={handleSave} />
            ) : selectedEntry ? (
              <>
                <div className="mb-8 flex items-start justify-between gap-6">
                  <div>
                    <h1 className="font-display-lg text-display-lg leading-none text-on-surface">
                      {fmtLong(selectedEntry.date || selectedEntry)}
                    </h1>
                    <p className="mt-3 font-data-md text-data-md text-on-surface-variant">
                      {parseEntryDate(selectedEntry).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      &bull; Local Time
                    </p>
                  </div>
                  {(selectedEntry.tag || selectedEntry.tags?.[0]) ? (
                    <div className="flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-3 py-1 font-label-caps text-label-caps text-primary">
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      <span>{selectedEntry.tag || selectedEntry.tags[0]}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex-1">
                  <h2 className="mb-6 border-b border-outline-variant/20 pb-4 font-headline-md text-headline-md text-on-surface">
                    {entryTitle(selectedEntry)}
                  </h2>
                  {paragraphs.map((paragraph, index) => (
                    <p className="mb-6 font-body-lg text-body-lg leading-relaxed text-on-surface/90" key={`${index}-${paragraph}`}>
                      {paragraph}
                    </p>
                  ))}
                  <CriticalPath items={criticalPathItems(selectedEntry.criticalPath)} />
                </div>

                <footer className="mt-8 flex items-center justify-between border-t border-outline-variant/20 pt-6 text-on-surface-variant">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 transition-colors hover:text-primary" type="button">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      <span>Edit</span>
                    </button>
                    <button className="flex items-center gap-2 transition-colors hover:text-error" type="button">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      <span>Trash</span>
                    </button>
                  </div>
                  <span className="rounded border border-white/20 bg-surface px-3 py-1 font-data-md text-data-md">
                    Word count: {wordCount(selectedContent)}
                  </span>
                </footer>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center font-body-md text-body-md text-on-surface-variant">
                Select an entry to read
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
