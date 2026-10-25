import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { Bouton } from "@/components/ui/Bouton";
import { Feu } from "@/components/ui/Feu";
import { SelecteurPeriode } from "@/components/ui/SelecteurPeriode";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { programmeQuery, type IndicateurProgramme } from "@/features/pilotage/apiCockpit";
import { periodeCourante, type Periode } from "@/lib/periode";

/**
 * Indicateurs cibles du programme — §3.11 et §9 du BRD.
 *
 * « Suivre les indicateurs cibles du programme et leur évolution N vs N-1. »
 *
 * Chaque ligne porte trois valeurs, et il en faut trois. Sans l'année passée,
 * une valeur ne dit pas si l'on progresse ; sans la cible, elle ne dit pas si
 * cela suffit. Un taux de 41 % de dématérialisation est un échec au regard de
 * la cible de 50, et une progression considérable au regard des 22 % de
 * l'année précédente — les deux lectures sont vraies et doivent coexister.
 *
 * Trois indicateurs n'ont aucune valeur : l'automatisation par l'IA, la
 * satisfaction usager et le taux d'adoption ne sont pas mesurés à ce stade.
 * Ils s'affichent « non mesuré » plutôt qu'à zéro. Un zéro aurait fait croire
 * à un échec là où il n'y a qu'une absence de mesure — c'est une distinction
 * que le contrôle de gestion ne peut pas se permettre de perdre.
 */
export function Programme() {
  const [periode, setPeriode] = useState<Periode>(() => periodeCourante("annee"));
  const { data, isPending } = useQuery(programmeQuery(periode.annee));

  const colonnes: Colonne<IndicateurProgramme>[] = [
    {
      cle: "libelle",
      entete: "Indicateur",
      largeur: "minmax(240px,2fr)",
      role: "titre",
      rendu: (i) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
            {i.libelle}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {i.modeCalcul}
          </span>
        </span>
      ),
    },
    {
      cle: "n1",
      entete: `${(data?.annee ?? periode.annee) - 1}`,
      largeur: "96px",
      alignement: "droite",
      rendu: (i) => (
        <span className="text-[11.5px] leading-none font-medium text-encre-tenue tabular-nums">
          {i.valeurN1 === null ? "—" : `${i.valeurN1} ${i.unite}`}
        </span>
      ),
    },
    {
      cle: "n",
      entete: `${data?.annee ?? periode.annee}`,
      largeur: "112px",
      alignement: "droite",
      rendu: (i) => {
        if (i.valeurN === null) {
          return (
            <span className="text-[11px] leading-none font-semibold text-alerte">Non mesuré</span>
          );
        }

        const progresse =
          i.valeurN1 === null
            ? null
            : i.cibleMaximum
              ? i.valeurN < i.valeurN1
              : i.valeurN > i.valeurN1;

        return (
          <span className="flex min-w-0 flex-col items-end gap-1.5">
            <span className="text-[14px] leading-none font-extrabold text-encre tabular-nums">
              {i.valeurN} {i.unite}
            </span>
            {progresse !== null && (
              <span
                className={`text-[10px] leading-none font-bold tabular-nums ${
                  progresse ? "text-succes" : "text-danger"
                }`}
              >
                {progresse ? "▲" : "▼"}{" "}
                {Math.abs(Math.round((i.valeurN - (i.valeurN1 ?? 0)) * 10) / 10)} {i.unite}
              </span>
            )}
          </span>
        );
      },
    },
    {
      cle: "cible",
      entete: "Cible",
      largeur: "104px",
      alignement: "droite",
      rendu: (i) => (
        <span className="flex min-w-0 flex-col items-end gap-1.5">
          {/* Une cible non fixée s'affiche comme telle. Zéro aurait été une
              cible atteinte d'avance ; un chiffre plausible aurait été lu
              comme un engagement de l'institution. Voir A32. */}
          {i.cible === null ? (
            <span className="text-[11px] leading-none font-semibold text-encre-tenue">
              Non fixée
            </span>
          ) : (
            <span className="text-[11.5px] leading-none font-bold text-encre-douce tabular-nums">
              {i.cibleMaximum ? "≤ " : "≥ "}
              {i.cible} {i.unite}
            </span>
          )}
          <span className="text-[10px] leading-none font-medium text-encre-tenue">
            {i.echeance}
          </span>
        </span>
      ),
    },
    {
      cle: "etat",
      entete: "Situation",
      largeur: "148px",
      rendu: (i) => (
        <Feu
          niveau={i.feu}
          libelle={
            i.valeurN === null
              ? "Aucune donnée"
              : // Une valeur sans cible ne se juge pas : c'est le sens même
                // d'un indicateur *cible*. La colorer aurait inventé
                // l'engagement que le programme n'a pas fixé.
                i.cible === null
                ? "Cible non fixée"
                : i.feu === "vert"
                  ? "Cible atteinte"
                  : i.feu === "orange"
                    ? "Cible à portée"
                    : "Cible hors d'atteinte"
          }
        />
      ),
    },
    {
      cle: "source",
      entete: "Source",
      largeur: "148px",
      role: "meta",
      rendu: (i) => (
        <span className="truncate text-[11px] leading-none font-medium text-encre-tenue">
          {i.source}
        </span>
      ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Indicateurs du programme"
        compte={data?.indicateurs.length}
        sousTitre="Critères de succès du programme de transformation, comparés à l'exercice précédent"
        actions={
          <>
            <SelecteurPeriode periode={periode} onChange={setPeriode} />
            <Bouton icone="exporter">Exporter</Bouton>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

          <div className="rounded-none border border-bordure bg-surface px-4 pt-2 pb-2 md:px-5">
            <Tableau
                chargement={isPending}
              colonnes={colonnes}
              lignes={data?.indicateurs ?? []}
              cleLigne={(i) => i.code}
              vide="Aucun indicateur au référentiel du programme."
            />
          </div>

          <p className="px-1 text-[11px] leading-[1.5] font-medium text-encre-tenue">
            « Non mesuré » n'est pas zéro, et « cible non fixée » n'est pas une cible de zéro. Un
            indicateur sans dispositif de mesure s'affiche à ce titre plutôt qu'à zéro, qui se
            lirait comme un échec. Les cibles chiffrées du programme n'ont pas été communiquées ;
            elles s'administrent, et l'écran les montre absentes tant qu'elles le sont.
          </p>
        </div>
      </div>
    </>
  );
}
