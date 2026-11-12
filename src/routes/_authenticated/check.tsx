import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { formatBytes, sha256Hex, validateFileSize } from "@/lib/hash";

export const Route = createFileRoute("/_authenticated/check")({
  head: () => ({
    meta: [
      { title: "Compare files — FileProof" },
      { name: "description", content: "Compare the SHA-256 hashes of an original file and a copy." },
      { property: "og:title", content: "Compare files — FileProof" },
      { property: "og:description", content: "Compare the SHA-256 hashes of two files." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckPage,
});

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; a: string; b: string };

function CheckPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [result, setResult] = useState<Result>({ kind: "idle" });

  async function compare() {
    if (!a || !b) return;
    setResult({ kind: "loading" });
    try {
      const [ha, hb] = await Promise.all([
        a.arrayBuffer().then(sha256Hex),
        b.arrayBuffer().then(sha256Hex),
      ]);
      setResult({ kind: "done", a: ha, b: hb });
    } catch {
      setResult({ kind: "error", message: "Couldn't read one of the files. Please try again." });
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden max-w-[200px] truncate text-sm text-muted-foreground sm:inline">{user.email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </header>

      <main className="py-10">
        <h1 className="text-4xl font-semibold sm:text-5xl">Compare two files</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Files are hashed in memory in your browser. Their contents are never uploaded or saved.
        </p>

        <section className="mt-8 rounded-2xl border bg-card p-5 shadow-card sm:p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <DropZone label="Original file" file={a} onFile={(f) => { setA(f); setResult({ kind: "idle" }); }} />
            <DropZone label="Copy to check" file={b} onFile={(f) => { setB(f); setResult({ kind: "idle" }); }} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={compare} disabled={!a || !b || result.kind === "loading"}>
              {result.kind === "loading" ? "Calculating hashes…" : "Compare files"}
            </Button>
            {(a || b) && (
              <Button size="lg" variant="ghost" onClick={() => { setA(null); setB(null); setResult({ kind: "idle" }); }}>Reset</Button>
            )}
          </div>

          <div aria-live="polite">
            {result.kind === "error" && (
              <p role="alert" className="mt-6 rounded-xl bg-danger-soft p-4 text-destructive">{result.message}</p>
            )}
            {result.kind === "done" && <ResultPanel a={result.a} b={result.b} />}
          </div>
        </section>
      </main>
    </div>
  );
}

function ResultPanel({ a, b }: { a: string; b: string }) {
  const match = a === b;
  return (
    <div className={`mt-6 rounded-xl p-5 ${match ? "bg-success-soft" : "bg-danger-soft"}`}>
      <p className={`font-display text-2xl font-semibold ${match ? "text-success" : "text-destructive"}`}>
        {match ? "✓ Files are identical" : "✕ Files do not match"}
      </p>
      <p className="mt-1 text-sm text-foreground/80">
        {match ? "The copy is byte-for-byte the same as the original." : "The copy differs from the original — it may have been altered or corrupted."}
      </p>
      <dl className="mt-4 space-y-2 text-xs">
        <HashRow label="Original SHA-256" value={a} />
        <HashRow label="Copy SHA-256" value={b} />
      </dl>
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <dt className="flex items-center justify-between font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        <button
          type="button"
          className="rounded px-2 py-0.5 normal-case tracking-normal text-primary hover:bg-card focus-visible:outline-2 focus-visible:outline-ring"
          onClick={() => navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </dt>
      <dd className="mt-0.5 break-all rounded-md bg-card/70 px-2 py-1.5 font-mono text-foreground">{value}</dd>
    </div>
  );
}

function DropZone({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function take(f?: File) {
    if (!f) return;
    const e = validateFileSize(f.size);
    setErr(e);
    onFile(e ? null : f);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files[0]); }}
        className={`flex min-h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-ring ${drag ? "border-primary bg-secondary" : file ? "border-primary/60 bg-secondary/50" : "border-input bg-muted hover:border-primary/60"}`}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        {file ? (
          <>
            <span className="mt-2 max-w-full truncate font-semibold">{file.name}</span>
            <span className="text-sm text-muted-foreground">{formatBytes(file.size)} · tap to change</span>
          </>
        ) : (
          <>
            <span className="mt-2 font-semibold">Choose or drop a file</span>
            <span className="text-sm text-muted-foreground">Up to 100 MB</span>
          </>
        )}
      </button>
      <input ref={input} type="file" className="sr-only" tabIndex={-1} aria-label={label} onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
      {err && <p role="alert" className="mt-2 text-sm text-destructive">{err}</p>}
    </div>
  );
}
