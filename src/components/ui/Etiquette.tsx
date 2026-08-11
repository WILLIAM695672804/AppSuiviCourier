import type { ReactNode } from "react";

/**
 * Pastille de statut des maquettes : majuscules, tres petite, contour teinte.
 * Le ton porte le sens ; le libelle n'est jamais decore d'un point ni d'une icone.
 */
export type TonEtiquette = "neutre" | "accent" | "succes" | "alerte" | "danger" | "confidentiel";

const TONS: Record<TonEtiquette, string> = {
  neutre: "text-encre-douce border-neutre-trait bg-neutre-voile",
  accent: "text-accent-fonce border-accent-trait bg-[#f6f9ff]",
  succes: "text-succes border-succes-trait bg-succes-voile",
  alerte: "text-alerte border-alerte-trait bg-alerte-voile",
  danger: "text-danger border-danger-trait bg-danger-voile",
  confidentiel: "text-confidentiel border-confidentiel-trait bg-confidentiel-voile",
};

export function Etiquette({ ton = "neutre", children }: { ton?: TonEtiquette; children: ReactNode }) {
  return (
    <span
      className={`inline-block rounded-none border px-1.5 py-1 text-[9.5px] leading-none font-bold tracking-[.4px] uppercase ${TONS[ton]}`}
    >
      {children}
    </span>
  );
}
