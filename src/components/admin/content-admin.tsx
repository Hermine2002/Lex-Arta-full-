import { getRouteApi, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/articles";
import { resolveImageUrl } from "@/lib/assets";
import {
  linkStatus,
  listBlocks,
  listImages,
  listLinks,
  setBlock,
  setImage,
  setLink,
  type ImageItem,
  type LinkItem,
} from "@/lib/html-blocks";
import { deleteOverride, saveOverride } from "@/lib/page-overrides";
import { pages } from "@/lib/site-content";
import { PageTitle, Panel, field, useNotice } from "./ui-bits";

type Tab = "text" | "links" | "images";
type LinkPatch = Partial<Pick<LinkItem, "href" | "blank">>;
type ImagePatch = Partial<Pick<ImageItem, "src" | "alt">>;

const STATUS_LABEL: Record<string, string> = {
  ok: "",
  external: "external",
  mail: "email / phone",
  broken: "broken link",
  empty: "empty link",
};

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ContentAdmin() {
  const router = useRouter();
  const overrides = getRouteApi("__root__").useLoaderData()?.overrides ?? {};
  const paths = useMemo(() => Object.keys(pages).sort(), []);
  const known = useMemo(() => new Set(paths), [paths]);
  const [path, setPath] = useState("");
  const [tab, setTab] = useState<Tab>("text");
  const [query, setQuery] = useState("");
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [linkEdits, setLinkEdits] = useState<Record<number, LinkPatch>>({});
  const [imgEdits, setImgEdits] = useState<Record<number, ImagePatch>>({});
  const [uploading, setUploading] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const n = useNotice();
  const currentHtml = path ? overrides[path]?.html || pages[path]!.html : "";
  const blocks = useMemo(
    () => (currentHtml ? listBlocks(currentHtml) : []),
    [currentHtml],
  );
  const links = useMemo(
    () => (currentHtml ? listLinks(currentHtml) : []),
    [currentHtml],
  );
  const images = useMemo(
    () => (currentHtml ? listImages(currentHtml) : []),
    [currentHtml],
  );
  const dirty =
    Object.keys(edits).length +
    Object.keys(linkEdits).length +
    Object.keys(imgEdits).length;
  const q = query.trim().toLowerCase();

  function clearEdits() {
    setEdits({});
    setLinkEdits({});
    setImgEdits({});
  }

  async function save() {
    let html = currentHtml;
    // Links and images first: they never change the number of text blocks, so the
    // text-block indices below still point at the right elements.
    for (const [i, patch] of Object.entries(linkEdits))
      html = setLink(html, Number(i), patch);
    for (const [i, patch] of Object.entries(imgEdits))
      html = setImage(html, Number(i), patch);
    // Apply from the end so an edit can never shift the index of an earlier block.
    for (const i of Object.keys(edits)
      .map(Number)
      .sort((a, b) => b - a))
      html = setBlock(html, i, edits[i]!);
    setBusy(true);
    const err = await saveOverride(path, { html });
    setBusy(false);
    if (err) return n.fail(err);
    await router.invalidate();
    clearEdits();
    n.ok(`${dirty} change${dirty === 1 ? "" : "s"} saved.`);
  }
  async function reset() {
    if (
      !window.confirm(
        "Discard all edits for this page and go back to the bundled version?",
      )
    )
      return;
    const err = await deleteOverride(path);
    if (err) return n.fail(err);
    await router.invalidate();
    clearEdits();
    n.ok("Restored to the bundled page.");
  }
  async function upload(index: number, file: File) {
    setUploading(index);
    n.clear();
    const res = await uploadImage(file.name, await readFile(file));
    setUploading(null);
    if ("error" in res) return n.fail(res.error);
    setImgEdits((m) => ({ ...m, [index]: { ...m[index], src: res.url } }));
    n.ok("Image uploaded. Save to apply it to the page.");
  }

  const visibleBlocks = q
    ? blocks.filter((b) => (edits[b.index] ?? b.html).toLowerCase().includes(q))
    : blocks;
  const visibleLinks = q
    ? links.filter((l) =>
        `${l.text} ${linkEdits[l.index]?.href ?? l.href}`
          .toLowerCase()
          .includes(q),
      )
    : links;
  const visibleImages = q
    ? images.filter((im) =>
        `${imgEdits[im.index]?.src ?? im.src} ${imgEdits[im.index]?.alt ?? im.alt}`
          .toLowerCase()
          .includes(q),
      )
    : images;

  const tabButton = (t: Tab, label: string, count: number) => (
    <Button
      key={t}
      size="sm"
      variant={tab === t ? "default" : "outline"}
      onClick={() => setTab(t)}
    >
      {label} ({count})
    </Button>
  );

  return (
    <>
      <PageTitle
        title="Page editor"
        hint="Edit every piece of text, every link and every image of a page without touching HTML. Inline tags such as <strong> and <a> are kept in the text."
      />
      <Panel className="mb-5">
        <select
          className={`${field} max-w-xl`}
          value={path}
          onChange={(e) => {
            if (
              dirty &&
              !window.confirm("Discard unsaved changes on this page?")
            )
              return;
            setPath(e.target.value);
            clearEdits();
            setQuery("");
            n.clear();
          }}
          aria-label="Page"
        >
          <option value="">Choose a page…</option>
          {paths.map((p) => (
            <option key={p} value={p}>
              {p} — {pages[p]!.title}
            </option>
          ))}
        </select>
      </Panel>
      {path && (
        <>
          {/* Sits just below the admin top bar (64px), which would otherwise cover it. */}
          <div className="sticky top-[72px] z-10 mb-4 space-y-3 rounded-md border bg-card p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void save()} disabled={!dirty || busy}>
                {busy
                  ? "Saving…"
                  : `Save ${dirty || ""} change${dirty === 1 ? "" : "s"}`.trim()}
              </Button>
              <Button variant="outline" onClick={clearEdits} disabled={!dirty}>
                Undo unsaved
              </Button>
              <Button
                variant="outline"
                onClick={() => void reset()}
                disabled={!overrides[path]?.html}
              >
                Reset page
              </Button>
              <a
                className="text-sm text-primary underline"
                href={path}
                target="_blank"
                rel="noreferrer"
              >
                Preview ↗
              </a>
              {n.node}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {tabButton("text", "Text", blocks.length)}
              {tabButton("links", "Links", links.length)}
              {tabButton("images", "Images", images.length)}
              <input
                className={`${field} ml-auto max-w-xs`}
                placeholder="Search this page…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search this page"
              />
            </div>
          </div>

          {tab === "text" && (
            <div className="space-y-3">
              {visibleBlocks.map((b) => {
                const value = edits[b.index] ?? b.html;
                return (
                  <Panel key={b.index} className="p-3">
                    <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                      <span>
                        {b.tag}
                        {b.cls && ` · ${b.cls}`}
                        {b.hasMarkup && " · contains markup"}
                      </span>
                      {edits[b.index] !== undefined && (
                        <span className="text-primary">edited</span>
                      )}
                    </div>
                    <textarea
                      className={`${field} ${b.tag.startsWith("h") ? "font-semibold" : ""}`}
                      rows={Math.min(
                        8,
                        Math.max(1, Math.ceil(value.length / 110)),
                      )}
                      value={value}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEdits((m) => {
                          const next = { ...m };
                          if (v === b.html) delete next[b.index];
                          else next[b.index] = v;
                          return next;
                        });
                      }}
                    />
                  </Panel>
                );
              })}
            </div>
          )}

          {tab === "links" && (
            <div className="space-y-3">
              {visibleLinks.map((l) => {
                const href = linkEdits[l.index]?.href ?? l.href;
                const blank = linkEdits[l.index]?.blank ?? l.blank;
                const status = linkStatus(href, known);
                const update = (patch: LinkPatch) =>
                  setLinkEdits((m) => {
                    const merged = { ...m[l.index], ...patch };
                    const next = { ...m };
                    if (
                      (merged.href ?? l.href) === l.href &&
                      (merged.blank ?? l.blank) === l.blank
                    )
                      delete next[l.index];
                    else next[l.index] = merged;
                    return next;
                  });
                return (
                  <Panel key={l.index} className="p-3">
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="truncate font-medium text-foreground">
                        {l.text || "(no text — image or icon link)"}
                      </span>
                      <span className="flex shrink-0 gap-2">
                        {STATUS_LABEL[status] && (
                          <span
                            className={
                              status === "broken" || status === "empty"
                                ? "text-destructive"
                                : ""
                            }
                          >
                            {STATUS_LABEL[status]}
                          </span>
                        )}
                        {linkEdits[l.index] && (
                          <span className="text-primary">edited</span>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        className={`${field} flex-1`}
                        value={href}
                        onChange={(e) => update({ href: e.target.value })}
                        aria-label={`Link address for ${l.text || "link"}`}
                        list="admin-page-paths"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={blank}
                          onChange={(e) => update({ blank: e.target.checked })}
                        />
                        Open in new tab
                      </label>
                    </div>
                  </Panel>
                );
              })}
              <datalist id="admin-page-paths">
                {paths.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          )}

          {tab === "images" && (
            <div className="grid gap-3 md:grid-cols-2">
              {visibleImages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No images on this page.
                </p>
              )}
              {visibleImages.map((im) => {
                const src = imgEdits[im.index]?.src ?? im.src;
                const alt = imgEdits[im.index]?.alt ?? im.alt;
                const update = (patch: ImagePatch) =>
                  setImgEdits((m) => {
                    const merged = { ...m[im.index], ...patch };
                    const next = { ...m };
                    if (
                      (merged.src ?? im.src) === im.src &&
                      (merged.alt ?? im.alt) === im.alt
                    )
                      delete next[im.index];
                    else next[im.index] = merged;
                    return next;
                  });
                return (
                  <Panel key={im.index} className="space-y-2 p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Image {im.index + 1}</span>
                      {imgEdits[im.index] && (
                        <span className="text-primary">edited</span>
                      )}
                    </div>
                    {src && (
                      <img
                        src={resolveImageUrl(src)}
                        alt=""
                        className="h-40 w-full rounded border bg-muted object-contain"
                      />
                    )}
                    <label className="block text-sm">
                      Image address
                      <input
                        className={`${field} mt-1`}
                        value={src}
                        onChange={(e) => update({ src: e.target.value })}
                        placeholder="/images/… or /uploads/…"
                      />
                    </label>
                    <label className="block text-sm">
                      Alt text (describes the image for screen readers and SEO)
                      <input
                        className={`${field} mt-1`}
                        value={alt}
                        onChange={(e) => update({ alt: e.target.value })}
                      />
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary underline">
                      {uploading === im.index
                        ? "Uploading…"
                        : "Upload a replacement"}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploading !== null}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) void upload(im.index, f);
                        }}
                      />
                    </label>
                  </Panel>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}
