import type { ReactNode } from "react";
import { Icone, type NomIcone } from "@/components/ui/Icone";

export type TonEncart = "accent" | "succes" | "alerte" | "danger" | "confidentiel" | "neutre";

const TONS: Record<TonEncart, string> = {
  accent: "border-accent-trait bg-accent-voile text-accent-fonce",
  succes: "border-succes-trait bg-succes-voile text-succes",
  alerte: "border-alerte-trait bg-alerte-voile text-alerte",
  danger: "border-danger-trait bg-danger-voile text-danger",
  confidentiel: "border-confidentiel-trait bg-confidentiel-voile text-confidentiel",
  neutre: "border-bordure bg-surface-tete text-encre-moyenne",
};

/** Message contextuel encadre : consequence d'un choix, avertissement, controle. */
export function Encart({
  ton = "accent",
  icone,
  children,
}: {
  ton?: TonEncart;
  icone?: NomIcone;
  children: ReactNode;
}) {
  return (
    <div className={`flex items-start gap-2 rounded-none border px-3 py-2.5 ${TONS[ton]}`}>
      {icone && <Icone nom={icone} taille={15} epaisseur={1.6} className="mt-px flex-none" />}
      <p className="text-[11.5px] leading-[1.5] font-medium text-pretty">{children}</p>
    </div>
  );
}

/** Ligne de controle : un verdict, une phrase. Sert les blocs de verification. */
export function LigneControle({
  ton,
  children,
}: {
  ton: "succes" | "alerte" | "danger";
  children: ReactNode;
}) {
  const teinte = { succes: "text-succes", alerte: "text-alerte-vif", danger: "text-danger" }[ton];

  return (
    <div className="flex items-start gap-[9px]">
      <span className={`mt-px flex-none ${teinte}`}>
        <Icone nom={ton === "succes" ? "coche" : "aide"} taille={15} epaisseur={1.7} />
      </span>
      <span className="text-[11.5px] leading-[1.5] font-medium text-encre-moyenne">{children}</span>
    </div>
  );
}
