import { getRouteApi, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { changePassword } from "@/lib/admin-account";
import {
  defaultNav,
  saveSettings,
  type ContactSettings,
  type NavGroup,
  type SiteSettings,
} from "@/lib/site-settings";
import { PageTitle, Panel, field, useNotice } from "./ui-bits";

const SOCIALS = [
  "instagram",
  "facebook",
  "linkedin",
  "telegram",
  "whatsapp",
] as const;

const CONTACT_FIELDS: {
  key: keyof ContactSettings;
  label: string;
  type?: "textarea";
  placeholder?: string;
}[] = [
  { key: "companyName", label: "Legal company name" },
  { key: "email", label: "Contact email", placeholder: "info@example.com" },
  { key: "phone", label: "Phone", placeholder: "+44 …" },
  { key: "website", label: "Website", placeholder: "https://example.com" },
  {
    key: "address",
    label: "Address",
    type: "textarea",
    placeholder: "Street\nCity\nCountry",
  },
  { key: "companyNumber", label: "Company registration number" },
  { key: "copyright", label: "Copyright line" },
];
const move = <T,>(arr: T[], i: number, d: number): T[] => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j]!, c[i]!];
  return c;
};

export function SettingsAdmin() {
  const router = useRouter();
  const data = getRouteApi("__root__").useLoaderData();
  const initial = data!.settings;
  const [s, setS] = useState<SiteSettings>(initial);
  const [nav, setNav] = useState<NavGroup[]>(
    initial.nav ?? (defaultNav as NavGroup[]),
  );
  const [busy, setBusy] = useState(false);
  const n = useNotice();

  async function save() {
    setBusy(true);
    const isDefaultNav = JSON.stringify(nav) === JSON.stringify(defaultNav);
    const err = await saveSettings({ ...s, nav: isDefaultNav ? null : nav });
    setBusy(false);
    if (err) return n.fail(err);
    await router.invalidate();
    n.ok(
      "Settings saved. Contact details, menu, footer and colours are live on every page.",
    );
  }

  const setGroup = (gi: number, patch: Partial<NavGroup>) =>
    setNav((g) => g.map((x, i) => (i === gi ? { ...x, ...patch } : x)));
  const setContact = (patch: Partial<ContactSettings>) =>
    setS((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }));

  return (
    <>
      <PageTitle
        title="Site settings"
        hint="Everything here applies to every page, because the header and footer are rendered once for the whole site."
      />
      <div className="space-y-5">
        <Panel>
          <h2 className="mb-1 text-lg font-medium">Contact & company</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Shown in the site footer and used as the destination for the
            consultation form.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {CONTACT_FIELDS.map((f) => (
              <label
                key={f.key}
                className={`block text-sm ${f.type === "textarea" ? "md:col-span-2" : ""}`}
              >
                {f.label}
                {f.type === "textarea" ? (
                  <textarea
                    className={`${field} mt-1`}
                    rows={4}
                    placeholder={f.placeholder}
                    value={s.contact[f.key]}
                    onChange={(e) => setContact({ [f.key]: e.target.value })}
                  />
                ) : (
                  <input
                    className={`${field} mt-1`}
                    placeholder={f.placeholder}
                    value={s.contact[f.key]}
                    onChange={(e) => setContact({ [f.key]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-1 text-lg font-medium">Enquiry notifications</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Optional. Paste a webhook URL (Slack, Make, Zapier, n8n, Discord…)
            and each new consultation enquiry is POSTed to it as JSON. Leave
            empty to turn off.
          </p>
          <input
            className={field}
            placeholder="https://hooks.slack.com/…"
            value={s.notifyWebhook}
            onChange={(e) => setS({ ...s, notifyWebhook: e.target.value })}
          />
        </Panel>
        <Panel>
          <h2 className="mb-3 text-lg font-medium">Social links</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {SOCIALS.map((k) => (
              <label key={k} className="text-sm capitalize">
                {k}
                <input
                  className={`${field} mt-1 normal-case`}
                  placeholder="https://…"
                  value={s.socials[k]}
                  onChange={(e) =>
                    setS({
                      ...s,
                      socials: { ...s.socials, [k]: e.target.value },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-3 text-lg font-medium">Brand colours</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Hex values such as #5b1a2a. Leave empty for the default palette.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {(["primary", "gold", "ink"] as const).map((k) => (
              <label key={k} className="text-sm capitalize">
                {k === "ink" ? "Dark surface" : k}
                <span className="mt-1 flex gap-2">
                  <input
                    className={field}
                    placeholder="#……"
                    value={s.theme[k]}
                    onChange={(e) =>
                      setS({ ...s, theme: { ...s.theme, [k]: e.target.value } })
                    }
                  />
                  {/^#[0-9a-fA-F]{6}$/.test(s.theme[k]) && (
                    <span
                      className="h-9 w-9 shrink-0 rounded border"
                      style={{ background: s.theme[k] }}
                    />
                  )}
                </span>
              </label>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Services menu</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNav(defaultNav as NavGroup[])}
            >
              Reset to default
            </Button>
          </div>
          <div className="space-y-4">
            {nav.map((g, gi) => (
              <div key={gi} className="rounded border p-3">
                <div className="flex flex-wrap gap-2">
                  <input
                    className={`${field} flex-1 font-semibold`}
                    value={g.label}
                    onChange={(e) => setGroup(gi, { label: e.target.value })}
                    aria-label="Group label"
                  />
                  <input
                    className={`${field} flex-1`}
                    value={g.href}
                    onChange={(e) => setGroup(gi, { href: e.target.value })}
                    aria-label="Group link"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNav((a) => move(a, gi, -1))}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNav((a) => move(a, gi, 1))}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNav((a) => a.filter((_, i) => i !== gi))}
                  >
                    Remove
                  </Button>
                </div>
                <div className="mt-3 space-y-2 pl-4">
                  {g.links.map((l, li) => (
                    <div key={li} className="flex flex-wrap gap-2">
                      <input
                        className={`${field} flex-1`}
                        value={l.label}
                        onChange={(e) =>
                          setGroup(gi, {
                            links: g.links.map((x, i) =>
                              i === li ? { ...x, label: e.target.value } : x,
                            ),
                          })
                        }
                        aria-label="Link label"
                      />
                      <input
                        className={`${field} flex-1`}
                        value={l.href}
                        onChange={(e) =>
                          setGroup(gi, {
                            links: g.links.map((x, i) =>
                              i === li ? { ...x, href: e.target.value } : x,
                            ),
                          })
                        }
                        aria-label="Link URL"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setGroup(gi, { links: move(g.links, li, -1) })
                        }
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setGroup(gi, { links: move(g.links, li, 1) })
                        }
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setGroup(gi, {
                            links: g.links.filter((_, i) => i !== li),
                          })
                        }
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setGroup(gi, {
                        links: [...g.links, { label: "New link", href: "/" }],
                      })
                    }
                  >
                    + Add link
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setNav((a) => [
                  ...a,
                  { label: "New group", href: "/services/", links: [] },
                ])
              }
            >
              + Add group
            </Button>
          </div>
        </Panel>
        <div className="sticky bottom-0 flex items-center gap-3 border-t bg-muted py-3">
          <Button onClick={() => void save()} disabled={busy}>
            {busy ? "Saving…" : "Save all settings"}
          </Button>
          {n.node}
        </div>
        <SecurityPanel />
      </div>
    </>
  );
}

function SecurityPanel() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const n = useNotice();

  async function change() {
    if (next !== confirm) return n.fail("New passwords do not match.");
    setBusy(true);
    const err = await changePassword(current, next);
    setBusy(false);
    if (err) return n.fail(err);
    setCurrent("");
    setNext("");
    setConfirm("");
    n.ok(
      "Password changed. It is now stored securely (your session stays active).",
    );
  }

  return (
    <Panel>
      <h2 className="mb-1 text-lg font-medium">Your password</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Change the password for your own account. To manage other
        administrators, use the Users &amp; access section.
      </p>
      <div className="grid max-w-xl gap-3">
        <input
          type="password"
          className={field}
          placeholder="Current password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <input
          type="password"
          className={field}
          placeholder="New password (min 8 characters)"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <input
          type="password"
          className={field}
          placeholder="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <Button
            onClick={() => void change()}
            disabled={busy || !current || !next}
          >
            {busy ? "Changing…" : "Change password"}
          </Button>
          {n.node}
        </div>
      </div>
    </Panel>
  );
}
