import { useCallback, useEffect, useMemo, useState } from "react";
import GhostButton from "../components/ui/GhostButton";
import PrimaryButton from "../components/ui/PrimaryButton";
import { journalEntries as mockJournalEntries } from "../data/mockData";
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
const SMOKE_TEST_JOURNAL_PATTERNS = [/smoke/i, /task-1 testing-1/i, /manual smoke test/i];

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

function isSmokeTestJournalEntry(entry) {
  const searchableText = [entry?.title, entry?.content, entry?.body, entry?.firstSentence]
    .flat()
    .filter(Boolean)
    .join(" ");

  return SMOKE_TEST_JOURNAL_PATTERNS.some((pattern) => pattern.test(searchableText));
}

function productionJournalEntries(entryList) {
  return entryList.filter((entry) => !isSmokeTestJournalEntry(entry));
}

function buildDemoJournalEntries() {
  return productionJournalEntries(mockJournalEntries).map((entry, index) => ({
    ...entry,
    id: `demo-${entry.id}`,
    title: entry.title || "Operating Notes",
    body: entry.body || entry.firstSentence || "",
    created_at: new Date(Date.now() - index * 60000).toISOString(),
    written_at: new Date(Date.now() - index * 60000).toISOString(),
    tags: entry.tags || ["reflection"],
  }));
}

function sortJournalEntries(entryList) {
  return productionJournalEntries(entryList).sort((a, b) => {
    const aDate = parseEntryDate(a).getTime();
    const bDate = parseEntryDate(b).getTime();

    return (Number.isNaN(bDate) ? 0 : bDate) - (Number.isNaN(aDate) ? 0 : aDate);
  });
}

function criticalPathItems(criticalPath) {
  if (!criticalPath) return [];
  return Array.isArray(criticalPath) ? criticalPath : [criticalPath];
}

function makeLocalEntry(newEntry, existingEntry = null) {
  const now = new Date();

  return {
    ...existingEntry,
    id: existingEntry?.id || `local-${Date.now()}`,
    user_id: MOCK_USER_ID,
    weekday: existingEntry?.weekday || now.toLocaleDateString("en-US", { weekday: "long" }),
    day: existingEntry?.day || String(now.getDate()).padStart(2, "0"),
    month: existingEntry?.month || MONTHS_SHORT[now.getMonth()],
    mood: existingEntry?.mood || null,
    mood_tone: existingEntry?.mood_tone || null,
    title: newEntry.title,
    body: newEntry.content,
    content: newEntry.content,
    written_at: existingEntry?.written_at || now.toISOString(),
    created_at: existingEntry?.created_at || now.toISOString(),
    updated_at: now.toISOString(),
    tags: existingEntry?.tags || [],
  };
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function buildAiReflection(entry) {
  const content = entryContent(entry);
  const sentences = splitSentences(content);
  const summary = sentences.slice(0, 2).join(" ") || "No summary yet. Add a few lines to unlock a reflection.";
  const lowerContent = content.toLowerCase();
  const tagRules = [
    ["tasks", /\b(task|todo|deadline|ship|finish|blocked|priority)\b/],
    ["money", /\b(money|cash|invoice|expense|budget|paid|revenue)\b/],
    ["energy", /\b(tired|focus|energy|sleep|burnout|rest|morning)\b/],
    ["planning", /\b(plan|next|tomorrow|week|schedule|calendar)\b/],
    ["reflection", /\b(feel|learned|noticed|grateful|concern|thought)\b/],
  ];
  const tags = tagRules.filter(([, pattern]) => pattern.test(lowerContent)).map(([tag]) => tag);
  const actionItems = sentences
    .filter((sentence) => /\b(need to|should|must|todo|follow up|next|tomorrow|finish|send|call|book|review)\b/i.test(sentence))
    .slice(0, 3);

  return {
    summary,
    tags: tags.length ? tags : ["reflection"],
    actionItems: actionItems.length ? actionItems : ["Review this entry during the next planning block."],
  };
}

function JournalEntryForm({ initialEntry = null, onCancel, onSave }) {
  const [title, setTitle] = useState(() => (initialEntry ? entryTitle(initialEntry) : ""));
  const [content, setContent] = useState(() => (initialEntry ? entryContent(initialEntry) : ""));

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedContent = content.trim();

    if (!trimmedContent) return;

    onSave({
      title: title.trim() || "Untitled Entry",
      content: trimmedContent,
      body: trimmedContent
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
          {initialEntry ? "Update" : "Save"}
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

function AiReflection({ reflection }) {
  return (
    <section className="mt-8 rounded-lg border border-secondary/25 bg-secondary/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-secondary">auto_awesome</span>
        <h3 className="font-label-caps text-label-caps text-secondary">AI REFLECTION</h3>
      </div>
      <p className="font-body-md text-body-md text-on-surface/90">{reflection.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {reflection.tags.map((tag) => (
          <span className="rounded border border-white/15 bg-surface px-2 py-1 font-data-md text-[11px] text-on-surface-variant" key={tag}>
            #{tag}
          </span>
        ))}
      </div>
      <ul className="mt-5 space-y-2">
        {reflection.actionItems.map((item, index) => (
          <li className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant" key={`${item}-${index}`}>
            <span className="material-symbols-outlined mt-0.5 text-[16px] text-secondary">check_circle</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadNotice, setLoadNotice] = useState(null);
  const [formError, setFormError] = useState("");

  const selectedEntry = entries.find((entry) => entry.id === selectedId);
  const todayLabel = useMemo(() => fmtLong(new Date().toISOString()), []);
  const paragraphs = entryParagraphs(selectedEntry);
  const selectedContent = entryContent(selectedEntry);
  const aiReflection = useMemo(() => (selectedEntry ? buildAiReflection(selectedEntry) : null), [selectedEntry]);

  const setVisibleEntries = useCallback((entryList, preferredId = null) => {
    const visibleEntries = sortJournalEntries(entryList);

    setEntries(visibleEntries);
    setSelectedId((current) => {
      if (preferredId && visibleEntries.some((entry) => entry.id === preferredId)) return preferredId;
      if (current && visibleEntries.some((entry) => entry.id === current)) return current;
      return visibleEntries[0]?.id ?? null;
    });
  }, []);

  const useDemoEntries = useCallback(
    (notice) => {
      setVisibleEntries(buildDemoJournalEntries());
      setLoadNotice(notice);
      setLoading(false);
    },
    [setVisibleEntries],
  );

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setLoadNotice(null);
    setFormError("");

    if (!isSupabaseConfigured) {
      useDemoEntries("Live sync is not configured. Showing demo journal entries.");
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", MOCK_USER_ID)
        .order("created_at", { ascending: false });

      if (fetchError) {
        useDemoEntries("Live sync is unavailable. Showing demo journal entries.");
        return;
      }

      setVisibleEntries(data || []);
      setLoading(false);
    } catch (fetchError) {
      useDemoEntries("Live sync is unavailable. Showing demo journal entries.");
    }
  }, [setVisibleEntries, useDemoEntries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  async function handleSave(newEntry) {
    const localEntry = makeLocalEntry(newEntry);
    setFormError("");

    if (!isSupabaseConfigured) {
      setVisibleEntries([localEntry, ...entries], localEntry.id);
      setLoadNotice("Entry saved locally for this demo session.");
      setShowNewForm(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from("journal_entries")
        .insert({
          user_id: localEntry.user_id,
          weekday: localEntry.weekday,
          day: localEntry.day,
          month: localEntry.month,
          mood: localEntry.mood,
          mood_tone: localEntry.mood_tone,
          title: localEntry.title,
          body: localEntry.content,
          written_at: localEntry.written_at,
          tags: localEntry.tags,
        })
        .select("*")
        .single();

      if (insertError) {
        setVisibleEntries([localEntry, ...entries], localEntry.id);
        setLoadNotice("Live sync failed. Entry saved locally for this demo session.");
        setFormError("Live sync failed. Entry saved locally for the demo.");
        setShowNewForm(false);
        return;
      }

      setVisibleEntries([data, ...entries], data.id);
      setShowNewForm(false);
      fetchEntries();
    } catch (insertError) {
      setVisibleEntries([localEntry, ...entries], localEntry.id);
      setLoadNotice("Live sync failed. Entry saved locally for this demo session.");
      setFormError("Live sync failed. Entry saved locally for the demo.");
      setShowNewForm(false);
    }
  }

  async function handleUpdate(updatedEntry) {
    if (!editingEntry) return;

    const localEntry = makeLocalEntry(updatedEntry, editingEntry);

    setFormError("");
    setVisibleEntries(entries.map((entry) => (entry.id === editingEntry.id ? localEntry : entry)), localEntry.id);
    setEditingEntry(null);
    setShowNewForm(false);

    if (!isSupabaseConfigured || String(editingEntry.id).startsWith("local-") || String(editingEntry.id).startsWith("demo-")) {
      setLoadNotice("Entry updated locally for this demo session.");
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("journal_entries")
        .update({
          title: localEntry.title,
          body: localEntry.content,
          updated_at: localEntry.updated_at,
        })
        .eq("id", editingEntry.id)
        .eq("user_id", MOCK_USER_ID);

      if (updateError) {
        setLoadNotice("Live sync failed. Update saved locally for this demo session.");
        return;
      }

      fetchEntries();
    } catch (updateError) {
      setLoadNotice("Live sync failed. Update saved locally for this demo session.");
    }
  }

  async function handleDelete(entry) {
    setFormError("");
    setVisibleEntries(entries.filter((currentEntry) => currentEntry.id !== entry.id));
    setShowNewForm(false);
    setEditingEntry(null);

    if (!isSupabaseConfigured || String(entry.id).startsWith("local-") || String(entry.id).startsWith("demo-")) {
      setLoadNotice("Entry moved to trash locally for this demo session.");
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", entry.id)
        .eq("user_id", MOCK_USER_ID);

      if (deleteError) {
        setLoadNotice("Live sync failed. Entry removed locally for this demo session.");
        return;
      }

      fetchEntries();
    } catch (deleteError) {
      setLoadNotice("Live sync failed. Entry removed locally for this demo session.");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-160px)] min-w-0 max-w-full flex-col gap-4 overflow-hidden bg-background md:h-[calc(100vh-48px)] md:gap-gutter md:p-margin-desktop">
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

      {loadNotice ? (
        <div className="rounded border border-secondary/30 bg-secondary/10 px-4 py-3 font-body-sm text-body-sm text-secondary">
          {loadNotice}
        </div>
      ) : null}
      {formError ? (
        <div className="rounded border border-error/40 bg-error/10 px-4 py-3 font-body-sm text-body-sm text-error">
          {formError}
        </div>
      ) : null}

      <div className="flex min-h-0 w-full max-w-full flex-1 flex-col gap-4 overflow-hidden lg:flex-row lg:gap-gutter">
        <section className="flex max-h-[42vh] min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-white/20 bg-[#1A1A1A] lg:max-h-none lg:w-1/2 lg:flex-1">
          <div className="flex min-w-0 items-center justify-between gap-3 border-b border-outline-variant/20 bg-surface-container-high/50 p-4 md:p-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">Entries</h2>
            <span className="rounded-full border border-white/20 bg-surface px-3 py-1 font-data-md text-data-md text-on-surface-variant">
              {entries.length} Total
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <LoadingSkeleton />
            ) : entries.length === 0 ? (
              <div className="p-6 font-body-md text-body-md text-on-surface-variant">No entries yet.</div>
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
                      <h3
                        className={`min-w-0 break-words font-headline-md text-headline-md text-on-surface ${
                          selected ? "" : "opacity-80"
                        }`}
                      >
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

          <div className="border-t border-outline-variant/20 bg-surface-container-high/50 p-4 md:p-6">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary bg-transparent py-3 font-label-caps text-label-caps text-secondary transition-colors hover:bg-secondary/10"
              type="button"
              onClick={() => {
                setEditingEntry(null);
                setShowNewForm(true);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">edit_document</span>
              + NEW ENTRY
            </button>
          </div>
        </section>

        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/20 bg-[#1A1A1A] lg:w-1/2">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-4 md:p-8">
            {showNewForm || editingEntry ? (
              <JournalEntryForm
                initialEntry={editingEntry}
                onCancel={() => {
                  setShowNewForm(false);
                  setEditingEntry(null);
                }}
                onSave={editingEntry ? handleUpdate : handleSave}
              />
            ) : selectedEntry ? (
              <>
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0">
                    <h1 className="break-words font-display-lg text-display-lg-mobile leading-tight text-on-surface md:text-display-lg md:leading-none">
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
                  {aiReflection ? <AiReflection reflection={aiReflection} /> : null}
                </div>

                <footer className="mt-8 flex flex-col gap-4 border-t border-outline-variant/20 pt-6 text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      className="flex items-center gap-2 transition-colors hover:text-primary"
                      onClick={() => setEditingEntry(selectedEntry)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      <span>Edit</span>
                    </button>
                    <button
                      className="flex items-center gap-2 transition-colors hover:text-error"
                      onClick={() => handleDelete(selectedEntry)}
                      type="button"
                    >
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
