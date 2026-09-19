import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

/** Champs à compléter par le propriétaire de l'app avant lancement public. */
export const LEGAL_PLACEHOLDERS = {
  company: "[À COMPLÉTER — raison sociale de l'éditeur]",
  address: "[À COMPLÉTER — adresse postale de l'éditeur]",
  siret: "[À COMPLÉTER — SIRET / numéro d'immatriculation]",
  publisher: "[À COMPLÉTER — nom du directeur de la publication]",
  host: "[À COMPLÉTER — hébergeur et son adresse]",
  email: "[À COMPLÉTER — adresse e-mail de contact]",
  updatedAt: "[À COMPLÉTER — date de dernière mise à jour]",
};

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-arena-gold/10 px-1 text-arena-gold">{children}</span>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-xs font-black tracking-widest text-arena">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}

export default function LegalLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-arena-border bg-background/95 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur">
        <button
          onClick={() => navigate({ to: "/" })}
          aria-label="Retour"
          className="flex h-9 w-9 items-center justify-center text-arena-muted"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base font-black">{title}</h1>
      </header>

      <div className="px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-4">
        {intro && <p className="text-sm leading-relaxed text-arena-sub">{intro}</p>}
        {children}

        <div className="mt-8 flex flex-wrap gap-3 border-t border-arena-border pt-4 text-xs font-bold text-arena">
          <Link to="/legal/privacy">Confidentialité</Link>
          <Link to="/legal/terms">CGU</Link>
          <Link to="/legal/support">Contact & support</Link>
        </div>
      </div>
    </div>
  );
}
