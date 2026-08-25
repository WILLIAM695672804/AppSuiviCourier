import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { EtatChargement } from "@/components/ui/EtatChargement";
import { Anneau } from "@/components/ui/Anneau";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Feu } from "@/components/ui/Feu";
import { GrapheBarres } from "@/components/ui/GrapheBarres";
import { ficheStructureQuery, periodeDepuisUrl } from "@/features/performance/api";
import { libellePeriode } from "@/lib/periode";

/**
 * Décomposition du score d'une structure — §3.4.
 *
 * « Suivre la position de leur structure dans le classement de la matrice de
 * scoring administratif et consulter la décomposition de leur score par
 * critère. » C'est la contrepartie du classement : un responsable doit pouvoir
 * désigner la ligne qui le pénalise, sinon le classement n'est pas discutable.
 *
 * D'où la profondeur retenue : critère, puis sous-indicateurs avec leur valeur
 * et leur cible. On s'arrête là — descendre au courrier individuel ferait de
 * cet écran un outil de contrôle des personnes, ce qu'il n'est pas.
 */
export function FicheStructure() {
  const { sigle } = useParams();
  // La période vient de l'URL, posée par le classement : sans elle, la fiche
  // afficherait un autre mois que le tableau d'où l'on vient, et le rang
  // affiché ne correspondrait plus à celui qu'on a cliqué.
  const [parametres] = useSearchParams();
  const periode = periodeDepuisUrl(parametres);
  const { data: fiche } = useQuery(ficheStructureQuery(sigle ?? "", periode.annee, periode.rang));

  if (!fiche) {
    return (
      <>
        <EnTetePage
          titre="Structure"
          miettes={[
            {
              libelle: "Matrice de scoring",
              chemin: `/performance/classement?annee=${periode.annee}&mois=${periode.rang}`,
            },
          ]}
        />
        <EtatChargement message="Calcul du score de la structure…" />
      </>
    );
  }

  const evolutionRang = fiche.rangPrecedent === null ? null : fiche.rangPrecedent - fiche.rang;
  const evolutionScore =
    fiche.scorePrecedent === null ? null : fiche.scoreGlobal - fiche.scorePrecedent;
  const ecartMoyenne = fiche.scoreGlobal - fiche.moyenneInstitution;

  return (
    <>
      <EnTetePage
        titre={fiche.structureLibelle}
        sousTitre={`${fiche.structureSigle} — ${libellePeriode(fiche.periode)}`}
        miettes={[
          {
            libelle: "Matrice de scoring",
            chemin: `/performance/classement?annee=${periode.annee}&mois=${periode.rang}`,
          },
          { libelle: fiche.structureSigle },
        ]}
        actions={<Bouton icone="imprimante">Imprimer la fiche</Bouton>}
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <div className="grid items-start gap-3.5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Carte titre="Score global">
              <div className="mt-3.5 flex flex-col items-center gap-3.5">
                <Anneau pourcentage={fiche.scoreGlobal} objectif={85} taille={132} />

                <div className="flex w-full flex-col gap-2 border-t border-separateur pt-3.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] leading-none font-semibold text-encre-tenue">
                      Rang
                    </span>
                    <span className="flex items-baseline gap-2">
                      <span className="text-[13px] leading-none font-extrabold text-encre tabular-nums">
                        {fiche.rang}
                        <span className="font-semibold text-encre-tenue">
                          {" "}
                          / {fiche.totalStructures}
                        </span>
                      </span>
                      {evolutionRang !== null && evolutionRang !== 0 && (
                        <span
                          className={`text-[10.5px] leading-none font-bold ${
                            evolutionRang > 0 ? "text-succes" : "text-danger"
                          }`}
                        >
                          {evolutionRang > 0 ? `▲ ${evolutionRang}` : `▼ ${-evolutionRang}`}
                        </span>
                      )}
                    </span>
                  </span>

                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] leading-none font-semibold text-encre-tenue">
                      Mois précédent
                    </span>
                    <span
                      className={`text-[12px] leading-none font-bold tabular-nums ${
                        evolutionScore === null
                          ? "text-encre-tenue"
                          : evolutionScore >= 0
                            ? "text-succes"
                            : "text-danger"
                      }`}
                    >
                      {evolutionScore === null
                        ? "—"
                        : `${evolutionScore >= 0 ? "+" : ""}${evolutionScore} pts`}
                    </span>
                  </span>

                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] leading-none font-semibold text-encre-tenue">
                      Écart à la moyenne
                    </span>
                    <span
                      className={`text-[12px] leading-none font-bold tabular-nums ${
                        ecartMoyenne >= 0 ? "text-succes" : "text-danger"
                      }`}
                    >
                      {ecartMoyenne >= 0 ? "+" : ""}
                      {ecartMoyenne} pts
                    </span>
                  </span>
                </div>
              </div>
            </Carte>

            <Carte titre="Évolution sur douze mois">
              <div className="mt-3.5">
                <GrapheBarres
                  categories={fiche.historique.map((point) => point.periode)}
                  series={[
                    {
                      libelle: "Score global",
                      couleur: "var(--color-accent)",
                      valeurs: fiche.historique.map((point) => point.score),
                    },
                  ]}
                  hauteur={150}
                />
              </div>
              <p className="mt-3 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                Les scores sont recalculés à chaque consultation depuis les données des piliers :
                une correction rétroactive se répercute sur toute la courbe. Aucune règle d'escalade
                automatique n'est en vigueur à ce jour.
              </p>
            </Carte>
          </div>

          {fiche.criteres.map((critere) => (
            <Carte
              key={critere.code}
              titre={critere.libelle}
              aDroite={
                <span className="flex items-center gap-3">
                  <span className="text-[11px] leading-none font-semibold text-encre-tenue">
                    poids {critere.poids} %
                  </span>
                  <span className="text-[15px] leading-none font-extrabold text-encre tabular-nums">
                    {critere.note}
                  </span>
                  <Feu niveau={critere.feu} muet />
                </span>
              }
            >
              <ul className="mt-3.5 flex flex-col">
                {critere.sousIndicateurs.map((indicateur, index) => (
                  <li
                    key={indicateur.libelle}
                    className={`flex flex-col gap-2 py-3 md:flex-row md:items-center md:gap-4 ${
                      index > 0 ? "border-t border-separateur" : ""
                    }`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="text-[12.5px] leading-[1.35] font-semibold text-encre">
                        {indicateur.libelle}
                      </span>
                      <span className="text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
                        constaté {indicateur.valeur} · cible {indicateur.cible}
                      </span>
                    </span>
                    <span className="w-full md:w-[180px]">
                      <BarreProgression taux={indicateur.taux} niveau={indicateur.feu} />
                    </span>
                  </li>
                ))}
              </ul>
            </Carte>
          ))}
        </div>
      </div>
    </>
  );
}
