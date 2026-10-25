import { PiedGraphe } from "@/components/ui/PiedGraphe";

export interface SerieBarres {
  libelle: string;
  couleur: string;
  valeurs: number[];
}

/**
 * Histogramme groupe, en CSS pur.
 *
 * Pas de bibliotheque de graphiques : deux series et douze colonnes ne le
 * justifient pas, et une dependance de 300 ko pour trois rectangles se paie
 * a chaque chargement de page dans une administration ou le reseau est lent.
 *
 * La valeur exacte reste accessible au survol : un graphique ne remplace pas
 * le chiffre, il le situe.
 *
 * La legende, la mention d'axe et la note sont deleguees a `PiedGraphe`, qui
 * les pose au meme endroit sur tous les traces.
 */
export function GrapheBarres({
  categories,
  series,
  hauteur = 180,
  libelleAxe,
  note,
}: {
  categories: string[];
  series: SerieBarres[];
  hauteur?: number;
  /** Mention posee au pied : ce que comptent les barres, la periode couverte. */
  libelleAxe?: string;
  /** Reserve de lecture, posee a droite du pied. */
  note?: string;
}) {
  const maximum = Math.max(1, ...series.flatMap((s) => s.valeurs));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-1.5" style={{ height: hauteur }}>
        {categories.map((categorie, i) => (
          <div key={categorie} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1.5">
            <div className="flex h-full items-end justify-center gap-[3px] px-[6%]">
              {series.map((serie) => {
                const valeur = serie.valeurs[i] ?? 0;
                return (
                  <div
                    key={serie.libelle}
                    title={`${serie.libelle} · ${categorie} : ${valeur.toLocaleString("fr-FR")}`}
                    style={{
                      height: `${(valeur / maximum) * 100}%`,
                      background: serie.couleur,
                    }}
                    className="min-h-[2px] w-full max-w-6 rounded-none transition-[height] duration-200"
                  />
                );
              })}
            </div>
            {/* Tronque par construction : le survol rend le libelle entier,
                sans quoi un sigle coupe ne se decode plus. */}
            <span
              title={categorie}
              className="truncate text-center text-[10px] leading-none font-medium text-encre-tenue"
            >
              {categorie}
            </span>
          </div>
        ))}
      </div>

      <PiedGraphe series={series} mention={libelleAxe} note={note} />
    </div>
  );
}
