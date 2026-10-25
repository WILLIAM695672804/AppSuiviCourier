import { PiedGraphe } from "@/components/ui/PiedGraphe";
import { calculerGraduations } from "@/lib/graduations";

export interface PointColonne {
  libelle: string;
  valeur: number;
}

/**
 * Histogramme a une serie, valeurs ecrites, axe gradue, zero traverse.
 *
 * Distinct de `GrapheBarres`, qui compare deux series sans axe : ici la
 * grandeur se lit, elle ne se compare pas. D'ou les graduations a gauche, la
 * valeur posee sur chaque colonne, et surtout la ligne de zero, qui n'a de
 * sens que si la mesure peut etre negative — un ecart, une variation.
 *
 * Une colonne negative se colore en danger. Le modele gardait la meme teinte
 * pour tout ; sur un tableau de bord de direction, un recul doit se voir avant
 * qu'on ait lu le chiffre.
 *
 * Toujours pas de bibliotheque de graphiques : douze rectangles et cinq traits
 * ne paient pas 300 ko sur un reseau d'administration.
 */
export function GrapheColonnes({
  points,
  hauteur = 190,
  format = (valeur) => valeur.toLocaleString("fr-FR"),
  libelleAxe,
  note,
}: {
  points: PointColonne[];
  hauteur?: number;
  format?: (valeur: number) => string;
  /** Mention posee au pied : l'exercice, la periode couverte, l'unite. */
  libelleAxe?: string;
  /** Reserve de lecture, posee a droite du pied. */
  note?: string;
}) {
  const valeurs = points.map((point) => point.valeur);
  const graduations = calculerGraduations(Math.min(0, ...valeurs), Math.max(0, ...valeurs));
  const bas = graduations[0];
  const haut = graduations[graduations.length - 1];
  const amplitude = haut - bas || 1;

  /** Position verticale d'une valeur, en pourcentage depuis le bas du trace. */
  const position = (valeur: number) => ((valeur - bas) / amplitude) * 100;
  const zero = position(0);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {/* Graduations. Le decalage haut est celui de la zone de trace : les
            chiffres doivent tomber en face de leurs traits, pas a cote. */}
        <div
          className="flex w-10 flex-none flex-col-reverse justify-between pt-4"
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

        {/* La reserve haute laisse la place a l'etiquette de la plus haute
            colonne, qui sort du trace par definition. */}
        <div className="relative min-w-0 flex-1 pt-4" style={{ height: hauteur }}>
          <div className="absolute inset-x-0 top-4 bottom-0">
            {graduations.map((niveau) => (
              <span
                key={niveau}
                className={`absolute inset-x-0 border-t ${
                  niveau === 0 ? "border-bordure-forte" : "border-separateur"
                }`}
                style={{ bottom: `${position(niveau)}%` }}
                aria-hidden="true"
              />
            ))}

            {points.map((point, index) => {
              const negatif = point.valeur < 0;
              const taille = Math.abs(position(point.valeur) - zero);

              return (
                <div
                  key={point.libelle}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${(100 / points.length) * index}%`,
                    width: `${100 / points.length}%`,
                  }}
                >
                  <span
                    title={`${point.libelle} : ${format(point.valeur)}`}
                    className={`absolute left-1/2 w-[56%] max-w-14 -translate-x-1/2 ${
                      negatif ? "rounded-none bg-danger-vif" : "rounded-none bg-accent"
                    }`}
                    style={
                      negatif
                        ? { top: `${100 - zero}%`, height: `${taille}%` }
                        : { bottom: `${zero}%`, height: `${taille}%` }
                    }
                  />
                  {/* La valeur d'une colonne positive se pose au-dessus ;
                      celle d'une colonne negative s'ecrit dans la barre, en
                      blanc. La poser dessous la ferait tomber sur le nom du
                      mois, qui est deja la. */}
                  <span
                    className={`absolute left-1/2 -translate-x-1/2 text-[10px] leading-none font-bold tabular-nums ${
                      negatif ? "text-white" : "text-encre"
                    }`}
                    style={
                      negatif
                        ? { top: `calc(${100 - zero}% + 5px)` }
                        : { bottom: `calc(${zero}% + ${taille}% + 5px)` }
                    }
                  >
                    {format(point.valeur)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <span className="w-10 flex-none" />
        <div className="flex min-w-0 flex-1">
          {points.map((point) => (
            <span
              key={point.libelle}
              title={point.libelle}
              className="min-w-0 flex-1 truncate text-center text-[10px] leading-none font-medium text-encre-tenue"
            >
              {point.libelle}
            </span>
          ))}
        </div>
      </div>

      {/* Une seule serie : pas de legende, le titre du panneau la nomme. La
          mention d'axe se pose a gauche, au meme endroit que partout ailleurs
          — elle etait centree, et l'oeil la cherchait d'un panneau a l'autre. */}
      <PiedGraphe mention={libelleAxe} note={note} />
    </div>
  );
}
