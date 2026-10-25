import type { ReactNode } from "react";
import { Link } from "react-router";
import { Icone } from "@/components/ui/Icone";

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
 *
 * `lien` rend le panneau entier cliquable, vers l'ecran qui porte la matiere du
 * graphique (ADR 027). Il est exclusif de `action` et de tout lien interne au
 * trace : un lien dans un lien ne se rend pas, et le clic devient imprevisible.
 * Quand le trace porte deja ses propres liens, c'est `action` qu'on emploie, et
 * le lien se pose a cote du titre.
 */
export function PanneauGraphe({
  titre,
  lien,
  libelleLien = "Voir le détail",
  action,
  children,
}: {
  titre: string;
  /** Rend le panneau entier cliquable. Exclusif de `action`. */
  lien?: string;
  /** Ce que le clic promet d'ouvrir. Pose en petit a droite du titre. */
  libelleLien?: string;
  /** Contenu a droite du titre, quand le trace porte deja ses propres liens. */
  action?: ReactNode;
  children: ReactNode;
}) {
  const habillage =
    "flex flex-col gap-3 rounded-none border border-[color:var(--color-bordure-carte)] bg-surface px-4 pt-4 pb-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]";

  const entete = (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[12.5px] leading-none font-bold text-encre">{titre}</h2>
      {lien ? (
        <span
          className="flex flex-none items-center gap-1 text-[10.5px] leading-none font-bold text-accent"
          data-impression="masquer"
        >
          {libelleLien}
          <Icone nom="chevronDroite" taille={11} epaisseur={2} />
        </span>
      ) : (
        action
      )}
    </div>
  );

  if (lien) {
    return (
      <Link
        to={lien}
        className={`${habillage} transition-colors duration-150 hover:border-accent hover:bg-surface-douce`}
      >
        {entete}
        <div className="min-h-[236px]">{children}</div>
      </Link>
    );
  }

  return (
    <section className={habillage}>
      {entete}
      <div className="min-h-[236px]">{children}</div>
    </section>
  );
}
