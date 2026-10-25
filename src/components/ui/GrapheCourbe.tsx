import { PiedGraphe } from "@/components/ui/PiedGraphe";
import { calculerGraduations } from "@/lib/graduations";

export interface PointCourbe {
  libelle: string;
  valeur: number;
}

/**
 * Courbe d'evolution, valeurs ecrites a chaque point.
 *
 * La courbe dit la tendance, jamais la valeur : c'est pourquoi chaque point
 * porte son chiffre. Sans eux, un directeur qui voit monter la ligne doit
 * encore ouvrir le rapport pour savoir de combien.
 *
 * Le trace est un SVG etire (`preserveAspectRatio="none"`) pose sous des
 * reperes en HTML : l'etirement deformerait le texte, mais il ne touche ni les
 * etiquettes ni les pastilles, qui sont positionnees en pourcentage par-dessus.
 * L'epaisseur du trait est preservee par `non-scaling-stroke`.
 */
export function GrapheCourbe({
  points,
  hauteur = 190,
  format = (valeur) => valeur.toLocaleString("fr-FR"),
  libelleAxe,
  note,
}: {
  points: PointCourbe[];
  hauteur?: number;
  format?: (valeur: number) => string;
  /** Mention posee au pied : l'exercice, la periode couverte, l'unite. */
  libelleAxe?: string;
  /** Reserve de lecture, posee a droite du pied. */
  note?: string;
}) {
  const valeurs = points.map((point) => point.valeur);
  const graduations = calculerGraduations(Math.min(...valeurs), Math.max(...valeurs));
  const bas = graduations[0];
  const haut = graduations[graduations.length - 1];
  const amplitude = haut - bas || 1;

  /** Position d'un point, en pourcentage du cadre : x de gauche, y du bas. */
  const repere = (valeur: number, index: number) => ({
    x: points.length === 1 ? 50 : (index / (points.length - 1)) * 100,
    y: ((valeur - bas) / amplitude) * 100,
  });

  const traces = points.map((point, index) => repere(point.valeur, index));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div
          className="flex w-10 flex-none flex-col-reverse justify-between pt-4 pb-0"
          style={{ height: hauteur }}
        >
          {graduations.map((niveau) => (
            <span
              key={niveau}
              className="text-right text-[9.5px] leading-none font-medium text-encre-tenue tabular-nums"
            >
              {format(niveau)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 pt-4" style={{ height: hauteur }}>
          {/* Le trace est encadre : les points extremes tombent sur les bords
              du cadre, et leurs etiquettes ont besoin de cette marge pour ne
              pas sortir de la carte. */}
          <div className="absolute inset-x-3 top-4 bottom-0">
            {graduations.map((niveau) => (
              <span
                key={niveau}
                className="absolute -inset-x-3 border-t border-separateur"
                style={{ bottom: `${((niveau - bas) / amplitude) * 100}%` }}
                aria-hidden="true"
              />
            ))}

            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full overflow-visible"
              aria-hidden="true"
            >
              <polyline
                points={traces.map((point) => `${point.x},${100 - point.y}`).join(" ")}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {points.map((point, index) => {
              const trace = traces[index];
              return (
                <span
                  key={point.libelle}
                  className="absolute"
                  style={{ left: `${trace.x}%`, bottom: `${trace.y}%` }}
                >
                  <span
                    title={`${point.libelle} : ${format(point.valeur)}`}
                    className="absolute size-[7px] -translate-x-1/2 translate-y-1/2 rounded-none border-2 border-accent bg-surface"
                  />
                  <span className="absolute -translate-x-1/2 -translate-y-2 text-[10px] leading-none font-bold whitespace-nowrap text-encre tabular-nums">
                    {format(point.valeur)}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <span className="w-10 flex-none" />
        <div className="relative min-w-0 flex-1">
          <div className="relative mx-3">
            {points.map((point, index) => (
              <span
                key={point.libelle}
                className="absolute -translate-x-1/2 text-[10px] leading-none font-medium whitespace-nowrap text-encre-tenue"
                style={{ left: `${traces[index].x}%` }}
              >
                {point.libelle}
              </span>
            ))}
          </div>
          {/* Les libelles sont poses en absolu : le bloc doit garder sa hauteur. */}
          <span className="block h-3" />
        </div>
      </div>

      {/* Une seule serie : pas de legende, le titre du panneau la nomme. La
          mention d'axe se pose a gauche, au meme endroit que partout ailleurs
          — elle etait centree, et l'oeil la cherchait d'un panneau a l'autre. */}
      <PiedGraphe mention={libelleAxe} note={note} />
    </div>
  );
}
