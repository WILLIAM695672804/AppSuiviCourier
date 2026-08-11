import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { EtatChargement } from "@/components/ui/EtatChargement";
import { Avatar } from "@/components/ui/Avatar";
import { BarreProgression } from "@/components/ui/BarreProgression";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Definition, GrilleDefinitions } from "@/components/ui/Definition";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import {
  ModaleAvancement,
  ModaleRelance,
} from "@/features/gouvernance/components/ModalesDecision";
import { decisionQuery, type EtatDecision } from "@/features/gouvernance/api";
import { formaterDate } from "@/lib/format";

/**
 * Suivi d'exécution d'une décision.
 *
 * L'écran répond à une question que personne ne peut trancher aujourd'hui sans
 * appeler trois structures : où en est-on, et qui bloque. D'où l'ordre des
 * blocs — l'avancement et les structures d'abord, les jalons ensuite, le fil
 * des observations en dernier.
 *
 * Les relances de la DSR apparaissent dans le même fil que les observations,
 * mais signalées. Les séparer aurait cassé la chronologie, qui est justement
 * ce qui permet de dire « relancé le 30 juillet, sans réponse depuis ».
 */
const TONS_ETAT: Record<EtatDecision, TonEtiquette> = {
  "À lancer": "neutre",
  "En cours": "accent",
  Exécutée: "succes",
  "En retard": "danger",
  Suspendue: "confidentiel",
};

export function FicheDecision() {
  const { id } = useParams();
  const [modale, setModale] = useState<"avancement" | "relance" | null>(null);
  const { data: decision } = useQuery(decisionQuery(Number(id)));

  if (!decision) {
    return (
      <>
        <EnTetePage titre="Décision" miettes={[{ libelle: "Décisions", chemin: "/gouvernance/decisions" }]} />
        <EtatChargement message="Ouverture de la décision…" />
      </>
    );
  }

  const jalonsFaits = decision.jalons.filter((j) => j.fait).length;

  return (
    <>
      <EnTetePage
        titre={decision.reference}
        sousTitre={decision.seance}
        miettes={[
          { libelle: "Décisions des instances", chemin: "/gouvernance/decisions" },
          { libelle: decision.reference },
        ]}
        actions={
          <>
            <Bouton icone="cloche" onClick={() => setModale("relance")}>
              Relancer
            </Bouton>
            <Bouton variante="principal" icone="coche" onClick={() => setModale("avancement")}>
              Consigner un avancement
            </Bouton>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_372px]">
          <div className="flex min-w-0 flex-col gap-3.5">
            <Carte titre="La décision" aDroite={<Etiquette ton={TONS_ETAT[decision.etat]}>{decision.etat}</Etiquette>}>
              <p className="mt-3 text-sm leading-[1.5] font-semibold text-encre">{decision.objet}</p>
              <p className="mt-2.5 text-[12px] leading-[1.55] font-medium text-encre-moyenne">
                {decision.contexte}
              </p>

              <GrilleDefinitions>
                <Definition libelle="Instance">{decision.instance}</Definition>
                <Definition libelle="Prise le">{formaterDate(decision.dateDecision)}</Definition>
                <Definition libelle="Échéance">
                  {decision.echeance ? formaterDate(decision.echeance) : "Non fixée"}
                </Definition>
                <Definition libelle="Origine">{decision.origine.libelle}</Definition>
              </GrilleDefinitions>

              <div className="mt-4 border-t border-separateur pt-4">
                <span className="text-[10.5px] leading-none font-semibold tracking-[.5px] text-encre-tenue uppercase">
                  Avancement d'ensemble
                </span>
                <div className="mt-2.5">
                  <BarreProgression taux={decision.avancement} cible={100} />
                </div>
              </div>

              {decision.etat === "Suspendue" && (
                <div className="mt-3.5">
                  <Encart ton="confidentiel" icone="horloge">
                    Décision suspendue : aucune échéance ne court, et aucune relance n'est
                    envoyée tant que la suspension n'est pas levée.
                  </Encart>
                </div>
              )}
            </Carte>

            <Carte
              titre="Structures chargées"
              aDroite={
                <span className="text-[11px] leading-none font-semibold text-encre-tenue">
                  {decision.structures.length} structure{decision.structures.length > 1 ? "s" : ""}
                </span>
              }
            >
              <ul className="mt-3.5 flex flex-col gap-2.5">
                {decision.structures.map((structure) => (
                  <li
                    key={structure.id}
                    className="flex flex-col gap-2.5 rounded-none border border-bordure px-3.5 py-3 md:flex-row md:items-center md:gap-4"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex items-center gap-2">
                        <span className="text-[12.5px] leading-none font-bold text-encre">
                          {structure.sigle}
                        </span>
                        {structure.pilote && (
                          <span className="rounded-none bg-accent-voile px-1.5 py-0.5 text-[9px] leading-none font-bold text-accent-fonce">
                            PILOTE
                          </span>
                        )}
                      </span>
                      <span className="truncate text-[11px] leading-none font-medium text-encre-tenue">
                        {structure.libelle}
                      </span>
                    </span>
                    <span className="w-full md:w-[180px]">
                      <BarreProgression taux={structure.avancement} />
                    </span>
                  </li>
                ))}
              </ul>

              {decision.structures.some((s) => s.pilote) && (
                <p className="mt-3 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                  La structure pilote rend compte pour l'ensemble : c'est elle que la relance
                  atteint, et elle seule qui déclare l'exécution.
                </p>
              )}
            </Carte>

            <Carte
              titre="Jalons"
              aDroite={
                <span className="text-[11px] leading-none font-semibold text-encre-tenue tabular-nums">
                  {jalonsFaits} / {decision.jalons.length}
                </span>
              }
            >
              {decision.jalons.length === 0 ? (
                <p className="mt-3.5 text-[12px] font-medium text-encre-tenue">
                  Aucun jalon défini. L'avancement est déclaré globalement par la structure pilote.
                </p>
              ) : (
                <ul className="mt-3.5 flex flex-col">
                  {decision.jalons.map((jalon, index) => {
                    const enRetard = !jalon.fait && new Date(jalon.echeance) < new Date();

                    return (
                      <li
                        key={jalon.id}
                        className={`flex items-start gap-3 py-3 ${
                          index > 0 ? "border-t border-separateur" : ""
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid size-5 flex-none place-items-center rounded-none border ${
                            jalon.fait
                              ? "border-succes bg-succes-voile text-succes"
                              : enRetard
                                ? "border-danger-trait bg-danger-voile text-danger"
                                : "border-bordure-forte text-encre-tenue"
                          }`}
                        >
                          {jalon.fait ? <Icone nom="coche" taille={11} epaisseur={2.2} /> : null}
                        </span>

                        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <span className="text-[12.5px] leading-[1.35] font-semibold text-encre">
                            {jalon.libelle}
                          </span>
                          <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                            {jalon.structure} · échéance {formaterDate(jalon.echeance)}
                            {jalon.fait && jalon.dateRealisation
                              ? ` · fait le ${formaterDate(jalon.dateRealisation)}`
                              : ""}
                          </span>
                        </span>

                        {enRetard && <Etiquette ton="danger">En retard</Etiquette>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Carte>
          </div>

          <div className="flex min-w-0 flex-col gap-3.5">
            <Carte
              titre="Fil de suivi"
              aDroite={
                decision.relances > 0 ? (
                  <Etiquette ton={decision.relances >= 3 ? "danger" : "alerte"}>
                    {decision.relances} relance{decision.relances > 1 ? "s" : ""}
                  </Etiquette>
                ) : undefined
              }
            >
              {decision.observations.length === 0 ? (
                <p className="mt-3.5 text-[12px] font-medium text-encre-tenue">
                  Aucune observation consignée à ce jour.
                </p>
              ) : (
                <ul className="mt-3.5 flex flex-col gap-3.5">
                  {decision.observations.map((observation) => (
                    <li key={observation.id} className="flex gap-2.5">
                      <Avatar initiales={observation.initiales} taille="petit" />
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[11.5px] leading-none font-bold text-encre">
                            {observation.auteur}
                          </span>
                          <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                            {formaterDate(observation.date)}
                          </span>
                          {observation.relance && <Etiquette ton="alerte">Relance</Etiquette>}
                        </span>
                        <span className="text-[11.5px] leading-[1.5] font-medium text-encre-moyenne">
                          {observation.texte}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Carte>

            <Carte titre="Ce que la décision a produit">
              {decision.retombees.length === 0 ? (
                <p className="mt-3.5 text-[12px] leading-[1.5] font-medium text-encre-tenue">
                  Rien de rattaché pour l'instant. Une décision sans retombée traçable après son
                  échéance est le premier signe qu'elle n'a pas été exécutée.
                </p>
              ) : (
                <ul className="mt-3.5 flex flex-col gap-2">
                  {decision.retombees.map((retombee) => {
                    const contenu = (
                      <>
                        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <span className="truncate text-[12px] leading-none font-semibold text-encre">
                            {retombee.libelle}
                          </span>
                          <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                            {retombee.type} · {retombee.reference}
                          </span>
                        </span>
                        {retombee.chemin && (
                          <Icone nom="chevronDroite" taille={13} className="flex-none text-encre-tenue" />
                        )}
                      </>
                    );

                    return (
                      <li key={retombee.reference}>
                        {retombee.chemin ? (
                          <Link
                            to={retombee.chemin}
                            className="flex items-center gap-2.5 rounded-none border border-bordure px-3 py-2.5 transition-colors duration-150 hover:bg-surface-douce"
                          >
                            {contenu}
                          </Link>
                        ) : (
                          <span className="flex items-center gap-2.5 rounded-none border border-bordure px-3 py-2.5">
                            {contenu}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Carte>
          </div>
        </div>
      </div>

      <ModaleAvancement
        ouverte={modale === "avancement"}
        onFermer={() => setModale(null)}
        decision={decision}
      />
      <ModaleRelance
        ouverte={modale === "relance"}
        onFermer={() => setModale(null)}
        decision={decision}
      />
    </>
  );
}
