import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Encart } from "@/components/ui/Encart";
import { Feu } from "@/components/ui/Feu";
import { SelecteurPeriode } from "@/components/ui/SelecteurPeriode";
import { Tableau, type Colonne } from "@/components/ui/Tableau";
import { matriceQuery, periodeDepuisUrl, type LigneClassement } from "@/features/performance/api";
import type { Periode } from "@/lib/periode";

/**
 * Matrice de scoring administratif — le classement mensuel des structures.
 *
 * Un classement de structures publiques n'est pas un objet neutre : il désigne
 * publiquement des derniers. Deux garde-fous en découlent, tous deux visibles
 * à l'écran.
 *
 * Le premier : chaque ligne est cliquable et mène à la décomposition du score.
 * Un rang sans explication ne produit que du ressentiment ; un rang qu'on peut
 * décomposer par critère devient un sujet de travail.
 *
 * Le second : quand la période n'est pas close, le classement est annoncé comme
 * provisoire. Comparer des structures sur un mois en cours revient à comparer
 * des mesures prises à des moments différents.
 */
export function Classement() {
  const naviguer = useNavigate();

  // La période vit dans l'URL et non dans un état local : la fiche d'une
  // structure doit s'ouvrir sur le mois qu'on regardait, et un lien partagé
  // doit rester exact. À défaut de paramètre, le dernier mois clos — le seul
  // comparable d'une structure à l'autre.
  const [parametres, setParametres] = useSearchParams();
  const periode = periodeDepuisUrl(parametres);

  function changerPeriode(suivante: Periode) {
    setParametres(
      { annee: String(suivante.annee), mois: String(suivante.rang) },
      { replace: true },
    );
  }

  const { data, isPending } = useQuery(matriceQuery(periode.annee, periode.rang));
  const lignes = data?.lignes ?? [];

  const colonnes: Colonne<LigneClassement>[] = [
    {
      cle: "rang",
      entete: "Rang",
      largeur: "88px",
      role: "resume",
      rendu: (l) => {
        const evolution = l.rangPrecedent === null ? null : l.rangPrecedent - l.rang;
        return (
          <span className="flex items-center gap-2">
            <span className="text-[15px] leading-none font-extrabold text-encre tabular-nums">
              {l.rang}
            </span>
            {evolution !== null && evolution !== 0 && (
              <span
                className={`text-[10.5px] leading-none font-bold tabular-nums ${
                  evolution > 0 ? "text-succes" : "text-danger"
                }`}
                title={
                  evolution > 0
                    ? `Gagne ${evolution} place${evolution > 1 ? "s" : ""}`
                    : `Perd ${-evolution} place${-evolution > 1 ? "s" : ""}`
                }
              >
                {evolution > 0 ? `▲ ${evolution}` : `▼ ${-evolution}`}
              </span>
            )}
          </span>
        );
      },
    },
    {
      cle: "structure",
      entete: "Structure",
      largeur: "minmax(200px,1.8fr)",
      role: "titre",
      rendu: (l) => (
        <span className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[12.5px] leading-none font-bold text-encre">
            {l.structureSigle}
          </span>
          <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
            {l.structureLibelle}
          </span>
        </span>
      ),
    },
    ...(data?.lignes[0]?.criteres ?? []).map((critere): Colonne<LigneClassement> => ({
      cle: critere.code,
      entete: `${critere.libelle} · ${critere.poids} %`,
      largeur: "minmax(110px,1fr)",
      rendu: (l) => {
        const note = l.criteres.find((c) => c.code === critere.code);
        return note ? <BarreProgression taux={note.note} niveau={note.feu} /> : <span>—</span>;
      },
    })),
    {
      cle: "score",
      entete: "Score global",
      largeur: "126px",
      rendu: (l) => (
        <span className="flex min-w-0 flex-col items-start gap-1.5">
          <span className="text-[15px] leading-none font-extrabold text-encre tabular-nums">
            {l.scoreGlobal}
          </span>
          <Feu niveau={l.feu} />
        </span>
      ),
    },
  ];

  return (
    <>
      <EnTetePage
        titre="Matrice de scoring"
        compte={lignes.length}
        sousTitre="Classement mensuel des structures — activités, courrier et rituels"
        actions={
          <>
            <SelecteurPeriode periode={periode} onChange={changerPeriode} />
            <Bouton icone="exporter">Exporter</Bouton>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} chargement={isPending} />

          {data?.provisoire && (
            <Encart ton="alerte" icone="horloge">
              La période n'est pas close : ce classement est provisoire et ne doit pas être diffusé.
              Les structures n'ont pas toutes achevé leurs remontées du mois.
            </Encart>
          )}

          <div className="rounded-none border border-bordure bg-surface px-4 pt-2 pb-2 md:px-5">
            <Tableau
              chargement={isPending}
              colonnes={colonnes}
              lignes={lignes}
              cleLigne={(l) => l.structureSigle}
              onLigneClick={(l) =>
                naviguer(
                  `/performance/classement/${l.structureSigle}?annee=${periode.annee}&mois=${periode.rang}`,
                )
              }
              vide="Aucune structure évaluée sur cette période."
            />
          </div>

          <p className="px-1 text-[11px] leading-[1.5] font-medium text-encre-tenue">
            Le score global est la moyenne des critères mesurables, pondérée par les taux affichés
            en en-tête. Un critère sans matière ce mois-ci — aucune activité au plan, aucun courrier
            clôturé, aucune obligation échue — sort du calcul au lieu de compter zéro. Ouvrez une
            structure pour voir la décomposition de sa note, indicateur par indicateur.
          </p>
        </div>
      </div>
    </>
  );
}
