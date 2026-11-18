import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { insightCategories } from "@/data/insights";
import {
  deleteArticle,
  listArticles,
  saveArticle,
  slugify,
  uploadImage,
  type AdminArticle,
} from "@/lib/articles";
import { resolveImageUrl } from "@/lib/assets";
import { PageTitle, Panel, field, useNotice } from "./ui-bits";

type SectionDraft = { heading: string; body: string; points: string };
type SourceDraft = { label: string; href: string };
type Draft = {
  slug: string;
  title: string;
  category: string;
  dateTime: string;
  author: string;
  image: string;
  imageAlt: string;
  summary: string;
  brief: string;
  published: boolean;
  sections: SectionDraft[];
  sources: SourceDraft[];
};

const todayISO = () => new Date().toISOString().slice(0, 10);

function blankDraft(): Draft {
  return {
    slug: "",
    title: "",
    category: insightCategories[0],
    dateTime: todayISO(),
    author: "LEX ARTA",
    image: "",
    imageAlt: "",
    summary: "",
    brief: "",
    published: false,
    sections: [{ heading: "", body: "", points: "" }],
    sources: [],
  };
}

function toDraft(a: AdminArticle): Draft {
  return {
    slug: a.slug,
    title: a.title,
    category: a.category,
    dateTime: a.dateTime || todayISO(),
    author: a.author ?? "",
    image: a.image,
    imageAlt: a.imageAlt,
    summary: a.summary ?? "",
    brief: a.brief,
    published: a.published,
    sections: a.sections.length
      ? a.sections.map((s) => ({
          heading: s.heading,
          body: s.paragraphs.join("\n\n"),
          points: (s.points ?? []).join("\n"),
        }))
      : [{ heading: "", body: "", points: "" }],
    sources: a.sources.length ? a.sources.map((s) => ({ ...s })) : [],
  };
}

function displayDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fromDraft(d: Draft): AdminArticle {
  const author = d.author.trim();
  const summary = d.summary.trim();
  return {
    slug: d.slug.trim(),
    title: d.title.trim(),
    category: d.category,
    date: displayDate(d.dateTime),
    dateTime: d.dateTime,
    href: `/insights/${d.slug.trim()}/`,
    image: d.image.trim(),
    imageAlt: d.imageAlt.trim(),
    ...(author ? { author } : {}),
    ...(summary ? { summary } : {}),
    brief: d.brief.trim(),
    published: d.published,
    updated_at: new Date().toISOString(),
    sections: d.sections.map((s) => ({
      heading: s.heading.trim(),
      paragraphs: s.body
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
      points: s.points
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean),
    })),
    sources: d.sources
      .map((s) => ({ label: s.label.trim(), href: s.href.trim() }))
      .filter((s) => s.label && s.href),
  };
}

export function InsightsAdmin() {
  const [rows, setRows] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const n = useNotice();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listArticles();
    setRows(res.rows);
    if (res.error) n.fail(res.error);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => void load(), [load]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      published: rows.filter((r) => r.published).length,
    }),
    [rows],
  );

  function startNew() {
    setDraft(blankDraft());
    setIsNew(true);
    setSlugTouched(false);
    n.clear();
  }
  function edit(a: AdminArticle) {
    setDraft(toDraft(a));
    setIsNew(false);
    setSlugTouched(true);
    n.clear();
  }
  function patch(p: Partial<Draft>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }
  function setTitle(title: string) {
    setDraft((d) =>
      d ? { ...d, title, slug: slugTouched ? d.slug : slugify(title) } : d,
    );
  }

  async function onUpload(file: File) {
    setUploading(true);
    n.clear();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const res = await uploadImage(file.name, dataUrl);
    setUploading(false);
    if ("error" in res) return n.fail(res.error);
    patch({ image: res.url, imageAlt: draft?.imageAlt || "" });
    n.ok("Image uploaded.");
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    const err = await saveArticle(fromDraft(draft));
    setBusy(false);
    if (err) return n.fail(err);
    n.ok("Article saved.");
    setSlugTouched(true);
    setIsNew(false);
    await load();
  }
  async function remove(a: AdminArticle) {
    if (
      !window.confirm(`Delete “${a.title || a.slug}”? This cannot be undone.`)
    )
      return;
    const err = await deleteArticle(a.slug);
    if (err) return n.fail(err);
    if (draft?.slug === a.slug) setDraft(null);
    await load();
  }

  // Section / source helpers
  const setSection = (i: number, p: Partial<SectionDraft>) =>
    patch({
      sections: draft!.sections.map((s, j) => (j === i ? { ...s, ...p } : s)),
    });
  const setSource = (i: number, p: Partial<SourceDraft>) =>
    patch({
      sources: draft!.sources.map((s, j) => (j === i ? { ...s, ...p } : s)),
    });

  return (
    <>
      <PageTitle
        title="Insights"
        hint="Write and publish articles. Drafts stay hidden; published articles appear on the public /insights page and get their own URL."
      />

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Panel className="max-h-[78vh] overflow-auto p-3">
          <Button className="mb-3 w-full" onClick={startNew}>
            + New article
          </Button>
          <p className="mb-2 px-1 text-xs text-muted-foreground">
            {counts.total} article{counts.total === 1 ? "" : "s"} ·{" "}
            {counts.published} published
          </p>
          {loading ? (
            <p className="px-1 text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">
              No articles yet. Create your first one.
            </p>
          ) : (
            <ul className="space-y-1">
              {rows.map((a) => (
                <li key={a.slug}>
                  <button
                    onClick={() => edit(a)}
                    className={`w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-accent ${draft?.slug === a.slug && !isNew ? "bg-accent" : ""}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {a.title || a.slug}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${a.published ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        {a.published ? "Published" : "Draft"}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {a.category} · {a.date}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          {!draft ? (
            <p className="text-sm text-muted-foreground">
              Select an article to edit, or create a new one.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 border-b pb-4">
                <Button onClick={() => void save()} disabled={busy}>
                  {busy ? "Saving…" : "Save article"}
                </Button>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.published}
                    onChange={(e) => patch({ published: e.target.checked })}
                  />
                  Published
                </label>
                {!isNew && draft.published && (
                  <a
                    className="text-sm text-primary underline"
                    href={`/insights/${draft.slug}/`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View ↗
                  </a>
                )}
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Close
                </Button>
                {n.node}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm md:col-span-2">
                  Title
                  <input
                    className={`${field} mt-1`}
                    value={draft.title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  URL slug
                  <input
                    className={`${field} mt-1`}
                    value={draft.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      patch({ slug: slugify(e.target.value) });
                    }}
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    /insights/{draft.slug || "…"}/
                  </span>
                </label>
                <label className="block text-sm">
                  Category
                  <select
                    className={`${field} mt-1`}
                    value={draft.category}
                    onChange={(e) => patch({ category: e.target.value })}
                  >
                    {insightCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Date
                  <input
                    type="date"
                    className={`${field} mt-1`}
                    value={draft.dateTime}
                    onChange={(e) => patch({ dateTime: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  Author
                  <input
                    className={`${field} mt-1`}
                    value={draft.author}
                    onChange={(e) => patch({ author: e.target.value })}
                  />
                </label>
              </div>

              <div className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">Hero image</p>
                <div className="flex flex-wrap items-center gap-3">
                  {draft.image ? (
                    <img
                      src={resolveImageUrl(draft.image)}
                      alt=""
                      className="h-16 w-24 rounded border object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-24 items-center justify-center rounded border text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <label className="cursor-pointer rounded-lg border px-3 py-2 text-sm hover:bg-accent">
                    {uploading ? "Uploading…" : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void onUpload(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <input
                  className={`${field} mt-3`}
                  placeholder="Image URL (e.g. /images/… or /uploads/…)"
                  value={draft.image}
                  onChange={(e) => patch({ image: e.target.value })}
                />
                <input
                  className={`${field} mt-2`}
                  placeholder="Image alt text"
                  value={draft.imageAlt}
                  onChange={(e) => patch({ imageAlt: e.target.value })}
                />
              </div>

              <label className="block text-sm">
                Card summary{" "}
                <span className="text-xs text-muted-foreground">
                  (short, shown on the Insights grid)
                </span>
                <textarea
                  className={`${field} mt-1`}
                  rows={2}
                  value={draft.summary}
                  onChange={(e) => patch({ summary: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                In brief{" "}
                <span className="text-xs text-muted-foreground">
                  (intro paragraph at the top of the article)
                </span>
                <textarea
                  className={`${field} mt-1`}
                  rows={3}
                  value={draft.brief}
                  onChange={(e) => patch({ brief: e.target.value })}
                />
              </label>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">Sections</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      patch({
                        sections: [
                          ...draft.sections,
                          { heading: "", body: "", points: "" },
                        ],
                      })
                    }
                  >
                    + Add section
                  </Button>
                </div>
                <div className="space-y-3">
                  {draft.sections.map((s, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <input
                          className={`${field} font-medium`}
                          placeholder="Section heading"
                          value={s.heading}
                          onChange={(e) =>
                            setSection(i, { heading: e.target.value })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            patch({
                              sections: draft.sections.filter(
                                (_, j) => j !== i,
                              ),
                            })
                          }
                          disabled={draft.sections.length === 1}
                        >
                          ✕
                        </Button>
                      </div>
                      <textarea
                        className={`${field} mb-2`}
                        rows={4}
                        placeholder="Body — separate paragraphs with a blank line"
                        value={s.body}
                        onChange={(e) =>
                          setSection(i, { body: e.target.value })
                        }
                      />
                      <textarea
                        className={field}
                        rows={2}
                        placeholder="Bullet points — one per line (optional)"
                        value={s.points}
                        onChange={(e) =>
                          setSection(i, { points: e.target.value })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">Primary sources</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      patch({
                        sources: [...draft.sources, { label: "", href: "" }],
                      })
                    }
                  >
                    + Add source
                  </Button>
                </div>
                <div className="space-y-2">
                  {draft.sources.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No sources added.
                    </p>
                  )}
                  {draft.sources.map((s, i) => (
                    <div key={i} className="flex flex-wrap gap-2">
                      <input
                        className={`${field} flex-1`}
                        placeholder="Label"
                        value={s.label}
                        onChange={(e) =>
                          setSource(i, { label: e.target.value })
                        }
                      />
                      <input
                        className={`${field} flex-1`}
                        placeholder="https://…"
                        value={s.href}
                        onChange={(e) => setSource(i, { href: e.target.value })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          patch({
                            sources: draft.sources.filter((_, j) => j !== i),
                          })
                        }
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {!isNew && (
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void remove(fromDraft(draft))}
                  >
                    Delete article
                  </Button>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
