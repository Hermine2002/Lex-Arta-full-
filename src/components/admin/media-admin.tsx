import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteMedia, listMedia, type MediaFile } from "@/lib/media";
import { PageTitle, Panel, useNotice } from "./ui-bits";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaAdmin() {
  const [rows, setRows] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const n = useNotice();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listMedia();
    setRows(res.rows);
    if (res.error) n.fail(res.error);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => void load(), [load]);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(window.location.origin + url);
      n.ok("URL copied to clipboard.");
    } catch {
      n.fail("Could not copy. The URL is " + url);
    }
  }
  async function remove(file: MediaFile) {
    if (
      !window.confirm(
        `Delete ${file.name}? Any page still using it will show a broken image.`,
      )
    )
      return;
    const err = await deleteMedia(file.name);
    if (err) return n.fail(err);
    setRows((all) => all.filter((f) => f.name !== file.name));
  }

  return (
    <>
      <PageTitle
        title="Media library"
        hint="Images uploaded through the article editor. Copy a URL to reuse an image, or delete ones you no longer need."
      />
      <div className="mb-4 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
        <span className="text-sm text-muted-foreground">
          {rows.length} file{rows.length === 1 ? "" : "s"}
        </span>
        {n.node}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Panel>
          <p className="text-sm text-muted-foreground">
            No uploads yet. Upload images from the hero-image field in the
            Insights editor; they appear here.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((f) => (
            <Panel key={f.name} className="p-3">
              <div className="mb-2 flex aspect-video items-center justify-center overflow-hidden rounded-lg border bg-muted">
                <img
                  src={f.url}
                  alt={f.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="truncate text-sm font-medium" title={f.name}>
                {f.name}
              </div>
              <div className="mb-2 text-xs text-muted-foreground">
                {formatBytes(f.size)} ·{" "}
                {new Date(f.modified).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void copy(f.url)}
                >
                  Copy URL
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void remove(f)}
                >
                  Delete
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
