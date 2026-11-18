import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAuthSnapshot,
  isEmail,
  login,
  logout,
  setupFirst,
  type SafeUser,
} from "@/lib/auth";

export type AuthState =
  | { status: "loading" }
  | { status: "setup" }
  | { status: "signed-out" }
  | { status: "ok"; user: SafeUser };

export function useAdminAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    void getAuthSnapshot()
      .then((snap) => {
        if (!alive) return;
        if (snap.user) setState({ status: "ok", user: snap.user });
        else if (!snap.hasUsers) setState({ status: "setup" });
        else setState({ status: "signed-out" });
      })
      .catch(() => {
        if (alive) setState({ status: "signed-out" });
      });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

export async function signOut() {
  await logout();
  if (typeof window !== "undefined") window.location.reload();
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mt-24 w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
      {children}
    </div>
  );
}

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        LEX ARTA
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await login({ email, password });
    if ("user" in res) {
      window.location.reload();
      return;
    }
    setError(res.error);
    setBusy(false);
  }

  return (
    <Card>
      <Heading
        title="Admin sign in"
        sub="Sign in with your administrator account."
      />
      <form onSubmit={submit} className="space-y-3">
        <Input
          type="email"
          required
          autoFocus
          placeholder="Email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          required
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}

function SetupForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) return setError("Enter a valid email address.");
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    setError(null);
    const res = await setupFirst({ email, name, password });
    if ("user" in res) {
      window.location.reload();
      return;
    }
    setError(res.error);
    setBusy(false);
  }

  return (
    <Card>
      <Heading
        title="Create your admin account"
        sub="No administrator exists yet. Set up the first owner account to secure the panel."
      />
      <form onSubmit={submit} className="space-y-3">
        <Input
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="email"
          required
          placeholder="Email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          required
          placeholder="Password (min 8 characters)"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          required
          placeholder="Confirm password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating…" : "Create account & sign in"}
        </Button>
      </form>
    </Card>
  );
}

export function GateMessage({ state }: { state: AuthState }) {
  if (state.status === "loading")
    return (
      <Card>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </Card>
    );
  if (state.status === "setup") return <SetupForm />;
  return <LoginForm />;
}
