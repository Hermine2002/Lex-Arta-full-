import { useState, type ReactNode } from "react";

export function PageTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {hint && (
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border bg-card p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
  active = false,
  onClick,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "primary" | "warn";
  active?: boolean;
  onClick?: () => void;
}) {
  const toneRing =
    tone === "warn"
      ? "text-destructive"
      : tone === "primary"
        ? "text-primary"
        : "text-foreground";
  const base =
    "rounded-xl border bg-card p-4 text-left shadow-sm transition " +
    (onClick ? "hover:border-primary/60 hover:shadow " : "") +
    (active ? "border-primary ring-1 ring-primary/30 " : "");
  const content = (
    <>
      <div className={`text-2xl font-semibold tabular-nums ${toneRing}`}>
        {value}
      </div>
      <div className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={base}>
      {content}
    </button>
  ) : (
    <div className={base}>{content}</div>
  );
}

export function useNotice() {
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const node = notice ? (
    <p
      className={`text-sm ${notice.ok ? "text-primary" : "text-destructive"}`}
      role="status"
    >
      {notice.text}
    </p>
  ) : null;
  return {
    node,
    ok: (text: string) => setNotice({ ok: true, text }),
    fail: (text: string) => setNotice({ ok: false, text }),
    clear: () => setNotice(null),
  };
}

export const field =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";
