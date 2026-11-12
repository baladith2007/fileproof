import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold text-foreground">FileProof</span>
    </Link>
  );
}
