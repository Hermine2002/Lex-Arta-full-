import { getRouteApi } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  deleteEnquiry,
  listEnquiries,
  updateEnquiry,
  type Enquiry,
  type EnquiryStatus,
} from "@/lib/enquiries";
import { linkStatus, listLinks } from "@/lib/html-blocks";
import { pages } from "@/lib/site-content";
import { PageTitle, Panel, StatCard, field, useNotice } from "./ui-bits";

const STATUS: { value: EnquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

function csvCell(v: string) {
  return `"${v.replace(/"/g, '""')}"`;
}

export function EnquiriesAdmin() {
  const loaderData = getRouteApi("__root__").useLoaderData();
  const overrides = useMemo(() => loaderData?.overrides ?? {}, [loaderData]);
  const publishedArticles = loaderData?.articles?.length ?? 0;
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | EnquiryStatus>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const n = useNotice();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listEnquiries();
    setRows(res.rows);
    setNotes(Object.fromEntries(res.rows.map((r) => [r.id, r.notes ?? ""])));
    if (res.error) n.fail(res.error);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => void load(), [load]);

  // Site health, computed from the bundled pages plus any admin edits.
  const siteHealth = useMemo(() => {
    const paths = Object.keys(pages);
    const known = new Set(paths);
    let broken = 0;
    for (const p of paths) {
      const html = overrides[p]?.html || pages[p]!.html;
      for (const l of listLinks(html)) {
        if (["broken", "empty"].includes(linkStatus(l.href, known))) broken++;
      }
    }
    const edited = Object.keys(overrides).filter(
      (k) => !k.startsWith("__"),
    ).length;
    return { pages: paths.length, edited, broken };
  }, [overrides]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        (!q ||
          [
            r.first_name,
            r.last_name,
            r.email,
            r.company_name,
            r.country,
            r.description,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
  }, [rows, filter, query]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      new: rows.filter((r) => r.status === "new").length,
      in_progress: rows.filter((r) => r.status === "in_progress").length,
      done: rows.filter((r) => r.status === "done").length,
    }),
    [rows],
  );

  async function setStatus(r: Enquiry, status: EnquiryStatus) {
    const err = await updateEnquiry(r.id, { status });
    if (err) return n.fail(err);
    setRows((all) => all.map((x) => (x.id === r.id ? { ...x, status } : x)));
  }
  async function saveNotes(r: Enquiry) {
    const err = await updateEnquiry(r.id, { notes: notes[r.id] || null });
    if (err) return n.fail(err);
    n.ok("Notes saved.");
    setRows((all) =>
      all.map((x) =>
        x.id === r.id ? { ...x, notes: notes[r.id] || null } : x,
      ),
    );
  }
  async function remove(r: Enquiry) {
    if (
      !window.confirm(`Delete the enquiry from ${r.first_name} ${r.last_name}?`)
    )
      return;
    const err = await deleteEnquiry(r.id);
    if (err) return n.fail(err);
    setRows((all) => all.filter((x) => x.id !== r.id));
  }
  function exportCsv() {
    const head = [
      "Date",
      "First name",
      "Last name",
      "Email",
      "Phone",
      "Country",
      "As",
      "Company",
      "Services",
      "Request",
      "Source",
      "Status",
      "Notes",
    ];
    const lines = shown.map((r) =>
      [
        r.created_at,
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.country,
        r.contacting_as,
        r.company_name,
        r.services.join("; "),
        r.description,
        r.source,
        r.status,
        r.notes ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob(
      ["﻿" + [head.map(csvCell).join(","), ...lines].join("\n")],
      {
        type: "text/csv;charset=utf-8",
      },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <PageTitle
        title="Dashboard"
        hint="Consultation enquiries and a snapshot of the site. Email and SMS alerts are sent by the notify-enquiry function (see ADMIN.md)."
      />

      <div className="mb-6 grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <StatCard
          label="All enquiries"
          value={counts.all}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <StatCard
          label="New"
          value={counts.new}
          tone="primary"
          active={filter === "new"}
          onClick={() => setFilter("new")}
        />
        <StatCard
          label="In progress"
          value={counts.in_progress}
          active={filter === "in_progress"}
          onClick={() => setFilter("in_progress")}
        />
        <StatCard
          label="Done"
          value={counts.done}
          active={filter === "done"}
          onClick={() => setFilter("done")}
        />
        <StatCard label="Articles" value={publishedArticles} />
        <StatCard label="Pages edited" value={siteHealth.edited} />
        <StatCard
          label="Broken links"
          value={siteHealth.broken}
          tone={siteHealth.broken ? "warn" : "default"}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className={`${field} max-w-xs`}
          placeholder="Search name, email, company…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={!shown.length}
        >
          Export CSV
        </Button>
        {filter !== "all" && (
          <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>
            Clear filter
          </Button>
        )}
        {n.node}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !shown.length ? (
        <Panel>
          <p className="text-sm text-muted-foreground">
            {rows.length
              ? "No enquiries match this view."
              : "No enquiries yet. Submissions from the contact form will appear here."}
          </p>
        </Panel>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <Panel key={r.id} className="p-0">
              <button
                className="flex w-full items-center justify-between gap-4 p-4 text-left"
                onClick={() => setOpen(open === r.id ? null : r.id)}
                aria-expanded={open === r.id}
              >
                <span>
                  <strong>
                    {r.first_name} {r.last_name}
                  </strong>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {r.company_name || r.contacting_as} · {r.country}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()} ·{" "}
                    {r.services.join(", ")}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs ${r.status === "new" ? "bg-primary text-primary-foreground" : r.status === "done" ? "bg-accent" : "bg-muted"}`}
                >
                  {STATUS.find((s) => s.value === r.status)!.label}
                </span>
              </button>
              {open === r.id && (
                <div className="space-y-4 border-t p-4 text-sm">
                  <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>
                      <a
                        className="text-primary underline"
                        href={`mailto:${r.email}`}
                      >
                        {r.email}
                      </a>
                    </dd>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>{r.phone || "—"}</dd>
                    <dt className="text-muted-foreground">Contacting as</dt>
                    <dd>{r.contacting_as || "—"}</dd>
                    <dt className="text-muted-foreground">Heard about us</dt>
                    <dd>{r.source || "—"}</dd>
                  </dl>
                  <p className="whitespace-pre-wrap rounded-lg bg-muted p-3">
                    {r.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      className={`${field} w-auto`}
                      value={r.status}
                      onChange={(e) =>
                        void setStatus(r, e.target.value as EnquiryStatus)
                      }
                      aria-label="Status"
                    >
                      {STATUS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void remove(r)}
                    >
                      Delete
                    </Button>
                  </div>
                  <div>
                    <textarea
                      className={field}
                      rows={3}
                      placeholder="Internal notes"
                      value={notes[r.id] ?? ""}
                      onChange={(e) =>
                        setNotes((m) => ({ ...m, [r.id]: e.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => void saveNotes(r)}
                    >
                      Save notes
                    </Button>
                  </div>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
