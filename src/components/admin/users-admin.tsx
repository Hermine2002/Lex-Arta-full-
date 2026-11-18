import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  auditLog,
  createUser,
  deleteUser,
  getAuthSnapshot,
  isEmail,
  listUsers,
  resetUserPassword,
  setUserRole,
  signOutEverywhere,
  type AuditEntry,
  type Role,
  type SafeUser,
} from "@/lib/auth";
import { PageTitle, Panel, field, useNotice } from "./ui-bits";

const ROLES: { value: Role; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "editor", label: "Editor" },
];

function when(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export function UsersAdmin() {
  const [rows, setRows] = useState<SafeUser[]>([]);
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [sessions, setSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const n = useNotice();

  const load = useCallback(async () => {
    setLoading(true);
    const [snap, res, log] = await Promise.all([
      getAuthSnapshot(),
      listUsers(),
      auditLog(),
    ]);
    setSelfId(snap.user?.id ?? null);
    setSessions(snap.sessions);
    setRows(res.rows);
    setActivity(log.rows);
    if (res.error) n.fail(res.error);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => void load(), [load]);

  async function add() {
    if (!isEmail(email)) return n.fail("Enter a valid email address.");
    if (password.length < 8)
      return n.fail("Password must be at least 8 characters.");
    setBusy(true);
    const err = await createUser({ email, name, role, password });
    setBusy(false);
    if (err) return n.fail(err);
    setEmail("");
    setName("");
    setPassword("");
    setRole("editor");
    n.ok("User added.");
    await load();
  }
  async function changeRole(u: SafeUser, next: Role) {
    const err = await setUserRole(u.id, next);
    if (err) return n.fail(err);
    setRows((all) =>
      all.map((x) => (x.id === u.id ? { ...x, role: next } : x)),
    );
    n.ok("Role updated.");
  }
  async function remove(u: SafeUser) {
    if (
      !window.confirm(`Remove ${u.email}? Their sessions will end immediately.`)
    )
      return;
    const err = await deleteUser(u.id);
    if (err) return n.fail(err);
    await load();
  }
  async function resetPwd(u: SafeUser) {
    const next = window.prompt(
      `Set a new password for ${u.email} (min 8 characters). They'll be signed out and must use the new one.`,
    );
    if (next === null) return;
    const err = await resetUserPassword(u.id, next);
    if (err) return n.fail(err);
    n.ok(`Password updated for ${u.email}.`);
  }
  async function signOutAll() {
    if (!window.confirm("Sign out of every device, including this one?"))
      return;
    const err = await signOutEverywhere();
    if (err) return n.fail(err);
    window.location.reload();
  }

  return (
    <>
      <PageTitle
        title="Users & access"
        hint="Add or remove administrators and set their role. Owners can manage users and everything else; editors can manage content but not other users."
      />

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-1 text-lg font-medium">Your sessions</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            You have {sessions} active session{sessions === 1 ? "" : "s"} (this
            device and any others you are still signed in on).
          </p>
          <Button variant="outline" size="sm" onClick={() => void signOutAll()}>
            Sign out of all devices
          </Button>
        </Panel>

        <Panel>
          <h2 className="mb-3 text-lg font-medium">Add administrator</h2>
          <div className="grid gap-3">
            <input
              className={field}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={field}
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex gap-3">
              <select
                className={`${field} w-auto`}
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                aria-label="Role"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <input
                className={field}
                placeholder="Temporary password (min 8)"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => void add()} disabled={busy}>
                {busy ? "Adding…" : "Add user"}
              </Button>
              {n.node}
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="p-0">
        {loading ? (
          <p className="p-5 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Last login</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="p-4">
                      <div className="font-medium">{u.name || u.email}</div>
                      {u.name && (
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                        </div>
                      )}
                      {u.id === selfId && (
                        <span className="text-xs text-primary">You</span>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        className={`${field} w-auto`}
                        value={u.role}
                        onChange={(e) =>
                          void changeRole(u, e.target.value as Role)
                        }
                        aria-label={`Role for ${u.email}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {when(u.createdAt)}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {when(u.lastLoginAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void resetPwd(u)}
                        >
                          Reset password
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={u.id === selfId}
                          onClick={() => void remove(u)}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="mt-5">
        <h2 className="mb-3 text-lg font-medium">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        ) : (
          <ul className="divide-y text-sm">
            {activity.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline gap-x-3 py-2"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(a.at).toLocaleString()}
                </span>
                <span className="font-medium">{a.action}</span>
                {a.detail && (
                  <span className="text-muted-foreground">{a.detail}</span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {a.email}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
