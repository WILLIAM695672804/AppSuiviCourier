import type { ReactNode } from "react";

/**
 * Carte de graphique.
 *
 * Volontairement plus sobre que `Carte` : titre plus discret, contenu qui
 * occupe toute la largeur. Un graphique se lit mieux sans concurrence, et les
 * ecrans qui l'emploient n'affichent que cela.
 *
 * La hauteur minimale est fixee ici, et non par le graphique : c'est elle qui
 * empeche la grille de se reorganiser pendant le chargement. Un panneau vide
 * occupe donc deja la place de son trace.
 */
export function PanneauGraphe({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-none border border-[color:var(--color-bordure-carte)] bg-surface px-4 pt-4 pb-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
      <h2 className="text-[12.5px] leading-none font-bold text-encre">{titre}</h2>
      <div className="min-h-[236px]">{children}</div>
    </section>
  );
}
