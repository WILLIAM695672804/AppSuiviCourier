import type { ReactNode } from "react";

export interface SerieLegende {
  libelle: string;
  /** Couleur CSS de la pastille. Employer `classe` si la teinte est utilitaire. */
  couleur?: string;
  /** Classe de fond, pour les traces dont les teintes sont deja des classes. */
  classe?: string;
}

/**
 * Pied de graphique — legende, mention d'axe, note de lecture.
 *
 * Un seul composant pour les cinq traces, parce que le probleme n'etait pas la
 * presence de ces mentions mais leur place : la legende de l'histogramme etait
 * calee a gauche, la mention d'axe des colonnes et de la courbe etait centree,
 * et le nuage portait les deux dans une rangee a lui. D'un panneau a l'autre,
 * l'oeil devait rechercher ou se trouvait la cle de lecture.
 *
 * L'ordre est donc fixe partout : **l'identite a gauche** (qui est quelle
 * couleur), **la mention d'axe a sa suite** (ce que compte l'axe, la periode
 * couverte), **la note a droite** (la reserve de lecture, quand le trace en
 * appelle une).
 *
 * Pas de legende pour une serie unique : le titre du panneau la nomme deja, et
 * une pastille seule n'apprend rien. Le seuil est donc a deux series — c'est
 * pourquoi `series` est filtre ici plutot que chez l'appelant, qui ne doit pas
 * avoir a connaitre la regle.
 *
 * Rien ne s'affiche si rien n'est fourni : un pied vide laisserait un blanc
 * sous le trace et decalerait les panneaux voisins de la grille.
 */
export function PiedGraphe({
  series = [],
  mention,
  note,
}: {
  /** Les series du trace. Ignorees s'il n'y en a qu'une. */
  series?: readonly SerieLegende[];
  /** Ce que compte l'axe, la periode couverte, l'unite. */
  mention?: string;
  /** Reserve de lecture, quand le trace suggere plus qu'il ne montre. */
  note?: ReactNode;
}) {
  const legende = series.length >= 2 ? series : [];

  if (legende.length === 0 && !mention && !note) return null;

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3.5 gap-y-1.5">
        {legende.map((serie) => (
          <span key={serie.libelle} className="flex items-center gap-1.5">
            <span
              className={`size-2 flex-none rounded-none ${serie.classe ?? ""}`}
              style={serie.couleur ? { background: serie.couleur } : undefined}
              aria-hidden="true"
            />
            {/* Le texte reste en encre : la couleur est portee par la
                pastille, l'ecrire deux fois brouille la lecture. */}
            <span className="text-[11px] leading-none font-medium text-encre-faible">
              {serie.libelle}
            </span>
          </span>
        ))}

        {mention && (
          <span className="text-[10px] leading-none font-medium text-encre-tenue">{mention}</span>
        )}
      </div>

      {note && (
        <span className="text-[10.5px] leading-[1.4] font-medium text-encre-tenue">{note}</span>
      )}
    </div>
  );
}
