import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — FileProof" },
      { name: "description", content: "Sign in or create a FileProof account to check files for tampering." },
      { property: "og:title", content: "Sign in — FileProof" },
      { property: "og:description", content: "Sign in or create a FileProof account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/check", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const em = emailSchema.safeParse(email);
    if (!em.success) return setError(em.error.issues[0]?.message ?? "Invalid email");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (mode === "signup" && password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: em.data,
          password,
          options: { emailRedirectTo: `${window.location.origin}/check` },
        });
        if (error) throw error;
        if (data.session) {
          await navigate({ to: "/check", replace: true });
        } else if (data.user && data.user.identities?.length === 0) {
          setMode("signin");
          setInfo("An account with this email already exists. Please sign in.");
        } else {
          setMode("signin");
          setInfo("Account created. Check your email to confirm, then sign in.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: em.data, password });
        if (error) throw error;
        if (data.session) await navigate({ to: "/check", replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        /invalid login/i.test(msg)
          ? "Incorrect email or password."
          : /not confirmed/i.test(msg)
            ? "Please confirm your email first, then sign in."
            : /pwned|compromised|weak/i.test(msg)
              ? "That password is too common or has appeared in a known data leak, so it isn't allowed. Try a longer, unique one — or tap \"Suggest a strong password\"."
              : msg || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="mb-8"><Logo /></div>
      <div className="w-full max-w-md rounded-2xl border bg-card p-7 shadow-card sm:p-9">
        <h1 className="text-3xl font-semibold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to verify your files." : "Start checking files for tampering."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button type="button" className="text-xs font-semibold text-primary" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
            <Input id="password" type={showPw ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            {mode === "signup" && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>At least 8 characters. Common or leaked passwords are blocked for your safety.</span>
                <button
                  type="button"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
                    const arr = crypto.getRandomValues(new Uint32Array(16));
                    const pw = Array.from(arr, (n) => chars[n % chars.length]).join("");
                    setPassword(pw);
                    setConfirm(pw);
                    setShowPw(true);
                    setError(null);
                  }}
                >
                  Suggest a strong password
                </button>
              </div>
            )}
          </div>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type={showPw ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
          )}
          {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">{error}</p>}
          {info && <p role="status" className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">{info}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New to FileProof?" : "Already have an account?"}{" "}
          <button type="button" className="font-semibold text-primary underline-offset-4 hover:underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}>
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
