import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FileProof — Digital File Tampering Checker" },
      { name: "description", content: "Compare two files with SHA-256 to confirm a copy hasn't been altered. Files never leave your device." },
      { property: "og:title", content: "FileProof — Digital File Tampering Checker" },
      { property: "og:description", content: "Compare two files with SHA-256 to confirm a copy hasn't been altered." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-6">
      <header className="flex items-center justify-between">
        <Logo />
        <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
      </header>
      <main className="flex flex-1 flex-col items-start justify-center py-16">
        <p className="mb-4 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">SHA-256 integrity check</p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] sm:text-7xl">Know if a file has been <em className="text-primary">tampered with.</em></h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">Drop in an original and a copy. FileProof fingerprints both and tells you whether they're byte-for-byte identical. Files are processed in your browser and never uploaded.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Create free account</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/check">Start checking</Link></Button>
        </div>
      </main>
      <section className="grid gap-4 pb-16 sm:grid-cols-3">
        {[
          ["01", "Choose two files", "Pick the original and the copy you received — up to 100 MB each."],
          ["02", "Fingerprint both", "We compute a SHA-256 hash of each file right in your browser."],
          ["03", "Get a verdict", "Identical hashes mean identical files. Any change shows up instantly."],
        ].map(([n, t, d]) => (
          <div key={n} className="rounded-2xl border bg-card p-6 shadow-card">
            <span className="font-mono text-sm text-primary">{n}</span>
            <h2 className="mt-2 text-xl font-semibold">{t}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
      <footer className="border-t py-6 text-sm text-muted-foreground">Your files never leave your device. © FileProof</footer>
    </div>
  );
}
