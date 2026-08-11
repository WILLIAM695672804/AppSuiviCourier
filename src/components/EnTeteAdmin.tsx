import type { ReactNode } from "react";

/**
 * En-tete des ecrans d'administration.
 *
 * Different de celui de l'espace de travail : titre plus grand, pose sur le
 * fond et non dans une barre. Les outils systeme ne s'y trouvent pas — ils
 * sont dans la barre haute de la disposition.
 */
export function EnTeteAdmin({
  titre,
  sousTitre,
  actions,
}: {
  titre: string;
  sousTitre?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-none flex-wrap items-center gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="text-[27px] leading-[1.15] font-extrabold tracking-[-.6px] text-encre">
          {titre}
        </h1>
        {sousTitre && (
          <p className="text-[12.5px] leading-none font-medium text-encre-tenue">{sousTitre}</p>
        )}
      </div>

      <div className="flex-1" />

      <span data-impression="masquer">{actions}</span>
    </header>
  );
}

/** Onglets de l'administration : soulignes, sur le fond papier. */
export function OngletsAdmin<T extends string>({
  onglets,
  actif,
  onChange,
}: {
  onglets: readonly { cle: T; libelle: string }[];
  actif: T;
  onChange: (cle: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="flex flex-none flex-wrap items-center gap-[30px] border-b border-bordure-forte px-0.5"
    >
      {onglets.map(({ cle, libelle }) => {
        const on = cle === actif;
        return (
          <button
            key={cle}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(cle)}
            className={`cursor-pointer border-b-2 pb-3 text-[13px] leading-none font-semibold transition-colors duration-150 ${
              on ? "border-encre text-encre" : "border-transparent text-encre-tenue hover:text-encre-faible"
            }`}
          >
            {libelle}
          </button>
        );
      })}
    </div>
  );
}
