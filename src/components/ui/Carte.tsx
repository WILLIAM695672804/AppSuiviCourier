import type { ReactNode } from "react";

/**
 * Bloc blanc pose sur le fond gris. C'est l'unite de composition des ecrans
 * de saisie et de consultation : un titre, un contenu, rien d'autre.
 */
export function Carte({
  titre,
  aDroite,
  children,
  className = "",
}: {
  titre?: string;
  /** Contenu aligne a droite du titre : un compteur, un lien, une action. */
  aDroite?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-none border border-[color:var(--color-bordure-carte)] bg-surface px-5 pt-[18px] pb-5 shadow-[0_1px_2px_rgba(16,24,40,.04)] ${className}`}
    >
      {(titre || aDroite) && (
        <div className="flex items-center justify-between gap-3">
          {titre && <h2 className="text-[13.5px] leading-none font-bold text-encre">{titre}</h2>}
          {aDroite}
        </div>
      )}
      {children}
    </section>
  );
}
