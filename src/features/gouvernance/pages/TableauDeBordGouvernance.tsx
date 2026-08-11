import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Avatar } from "@/components/ui/Avatar";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { tableauDeBordGouvernanceQuery } from "@/features/gouvernance/api";
import { useSession } from "@/lib/contexteSession";
import { formaterDate } from "@/lib/format";

/**
 * Tableau de bord du dispositif de suivi — niveau 2 du descriptif fonctionnel.
 *
 * « Niveau 2 — Pilotage tactique par structure : tableaux de bord de direction
 * et matrice de scoring, consultés par le CODIR, la DSR et les responsables de
 * structure. » C'est l'écran d'accueil de ces trois profils.
 *
 * Il ne montre que ce qui appelle une action : décisions à relancer, comptes
 * rendus manquants, absences sans suppléance. Ce qui va bien n'occupe qu'un
 * chiffre dans le bandeau. Une DSR qui ouvre l'application le matin ne cherche
 * pas à savoir ce qui fonctionne.
 *
 * La matrice de scoring viendra s'y ajouter — elle a besoin des activités,
 * qui ne sont pas encore construites.
 */
export function TableauDeBordGouvernance() {
  const session = useSession();
  const { data } = useQuery(tableauDeBordGouvernanceQuery());

  return (
    <>
      <EnTetePage
        titre="Pilotage du dispositif"
        sousTitre={`${session.structureLibelle} — exécution des décisions, tenue des instances et disponibilité`}
        actions={
          <Bouton variante="principal" icone="exporter">
            Exporter la synthèse
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} />

          <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-3.5">
              <Carte
                titre="Décisions à relancer"
                aDroite={
                  <Link
                    to="/gouvernance/decisions"
                    className="text-[11px] leading-none font-bold text-accent hover:underline"
                  >
                    Tout le registre
                  </Link>
                }
              >
                {(data?.aRelancer.length ?? 0) === 0 ? (
                  <p className="mt-3.5 text-[12px] font-medium text-encre-tenue">
                    Aucune décision en retard ni relancée. Rien à escalader ce matin.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col">
                    {data?.aRelancer.map((decision, index) => (
                      <li key={decision.id} className={index > 0 ? "border-t border-separateur" : ""}>
                        <Link
                          to={`/gouvernance/decisions/${decision.id}`}
                          className="-mx-2 flex flex-col gap-2.5 rounded-none px-2 py-3 transition-colors duration-150 hover:bg-surface-douce md:flex-row md:items-center md:gap-4"
                        >
                          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] leading-none font-bold text-accent tabular-nums">
                                {decision.reference}
                              </span>
                              {decision.etat === "En retard" && (
                                <Etiquette ton="danger">En retard</Etiquette>
                              )}
                              {decision.relances > 0 && (
                                <Etiquette ton={decision.relances >= 3 ? "danger" : "alerte"}>
                                  {decision.relances} relance{decision.relances > 1 ? "s" : ""}
                                </Etiquette>
                              )}
                            </span>
                            <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
                              {decision.objet}
                            </span>
                            <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                              {decision.structures.find((s) => s.pilote)?.sigle ?? "—"} · échéance{" "}
                              {decision.echeance ? formaterDate(decision.echeance) : "non fixée"}
                            </span>
                          </span>

                          <span className="w-full flex-none md:w-[132px]">
                            <BarreProgression taux={decision.avancement} />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Carte>

              <Carte
                titre="Comptes rendus en souffrance"
                aDroite={
                  <Link
                    to="/gouvernance/seances"
                    className="text-[11px] leading-none font-bold text-accent hover:underline"
                  >
                    Toutes les séances
                  </Link>
                }
              >
                {(data?.depotsEnSouffrance.length ?? 0) === 0 ? (
                  <p className="mt-3.5 text-[12px] font-medium text-encre-tenue">
                    Toutes les séances sont documentées.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col">
                    {data?.depotsEnSouffrance.map((seance, index) => (
                      <li key={seance.id} className={index > 0 ? "border-t border-separateur" : ""}>
                        <Link
                          to={`/gouvernance/seances/${seance.id}`}
                          className="-mx-2 flex items-center gap-3 rounded-none px-2 py-3 transition-colors duration-150 hover:bg-surface-douce"
                        >
                          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <span className="truncate text-[12.5px] leading-[1.35] font-semibold text-encre">
                              {seance.intitule}
                            </span>
                            <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                              {seance.structure} · attendu le {formaterDate(seance.echeanceDepot)}
                            </span>
                          </span>
                          <Etiquette ton={seance.depot === "Hors délai" ? "danger" : "alerte"}>
                            {seance.depot}
                          </Etiquette>
                          <Icone nom="chevronDroite" taille={13} className="flex-none text-encre-tenue" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Carte>
            </div>

            <div className="flex min-w-0 flex-col gap-3.5">
              <Carte
                titre="Absences sans intérim"
                aDroite={
                  <Link
                    to="/gouvernance/disponibilites"
                    className="text-[11px] leading-none font-bold text-accent hover:underline"
                  >
                    Le registre
                  </Link>
                }
              >
                {(data?.absencesSansInterim.length ?? 0) === 0 ? (
                  <p className="mt-3.5 text-[12px] leading-[1.5] font-medium text-encre-tenue">
                    Tous les responsables absents ont une suppléance désignée.
                  </p>
                ) : (
                  <ul className="mt-3.5 flex flex-col gap-2.5">
                    {data?.absencesSansInterim.map((absence) => (
                      <li
                        key={absence.id}
                        className="flex items-center gap-2.5 rounded-none border border-danger-trait bg-danger-voile px-3 py-2.5"
                      >
                        <Avatar initiales={absence.initiales} taille="petit" />
                        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                            {absence.responsable}
                          </span>
                          <span className="truncate text-[10.5px] leading-none font-medium text-encre-moyenne">
                            {absence.type} jusqu'au {formaterDate(absence.au)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Carte>

              <Carte titre="Décisions par instance">
                <ul className="mt-3.5 flex flex-col gap-3">
                  {data?.parInstance.map((ligne) => (
                    <li key={ligne.instance} className="flex flex-col gap-2">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[11.5px] leading-none font-semibold text-encre-douce">
                          {ligne.instance}
                        </span>
                        <span className="flex-none text-[11px] leading-none font-bold text-encre tabular-nums">
                          {ligne.total}
                          {ligne.enRetard > 0 && (
                            <span className="ml-1.5 font-bold text-danger">
                              dont {ligne.enRetard} en retard
                            </span>
                          )}
                        </span>
                      </span>
                      <BarreProgression
                        taux={ligne.total === 0 ? 0 : ((ligne.total - ligne.enRetard) / ligne.total) * 100}
                        chiffre={false}
                      />
                    </li>
                  ))}
                </ul>
              </Carte>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
