import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { EtatChargement } from "@/components/ui/EtatChargement";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Definition, GrilleDefinitions } from "@/components/ui/Definition";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { ModaleDeposerDocument } from "@/features/gouvernance/components/ModalesRegistre";
import { seanceQuery, type EtatDecision, type EtatDepot } from "@/features/gouvernance/api";
import { formaterDate } from "@/lib/format";

/**
 * Dossier de séance — §3.3, « préparation et conservation des documents ».
 *
 * Un même écran sert la préparation et l'archive : avant la séance, l'ordre du
 * jour et le dossier ; après, le compte rendu et les décisions qui en sont
 * issues. Séparer les deux moments aurait obligé la DSR à ressaisir l'ordre du
 * jour pour produire le compte rendu.
 *
 * Le lien vers les décisions est ce qui referme la boucle : c'est ici qu'on
 * vérifie qu'une séance a bien produit ce qu'elle annonçait.
 */
const TONS_DEPOT: Record<EtatDepot, TonEtiquette> = {
  Déposé: "succes",
  "En attente": "alerte",
  "Hors délai": "danger",
};

const TONS_ETAT: Record<EtatDecision, TonEtiquette> = {
  "À lancer": "neutre",
  "En cours": "accent",
  Exécutée: "succes",
  "En retard": "danger",
  Suspendue: "confidentiel",
};

export function FicheSeance() {
  const { id } = useParams();
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const { data: seance } = useQuery(seanceQuery(Number(id)));

  if (!seance) {
    return (
      <>
        <EnTetePage
          titre="Séance"
          miettes={[{ libelle: "Réunions et rapports", chemin: "/gouvernance/seances" }]}
        />
        <EtatChargement message="Ouverture du dossier de séance…" />
      </>
    );
  }

  const presents = seance.presents.filter((p) => p.present).length;
  const manquants = seance.documents.filter((d) => !d.depose);

  return (
    <>
      <EnTetePage
        titre={seance.intitule}
        sousTitre={`${seance.reference} · ${formaterDate(seance.date)}`}
        miettes={[
          { libelle: "Réunions et rapports", chemin: "/gouvernance/seances" },
          { libelle: seance.reference },
        ]}
        actions={
          <>
            <Bouton icone="imprimante">Imprimer le dossier</Bouton>
            <Bouton variante="principal" icone="plus" onClick={() => setModaleOuverte(true)}>
              Déposer un document
            </Bouton>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_372px]">
          <div className="flex min-w-0 flex-col gap-3.5">
            <Carte titre="La séance" aDroite={<Etiquette ton={TONS_DEPOT[seance.depot]}>{seance.depot}</Etiquette>}>
              <GrilleDefinitions>
                <Definition libelle="Nature">{seance.type}</Definition>
                <Definition libelle="Tenue le">{formaterDate(seance.date)}</Definition>
                <Definition libelle="Présidée par">
                  {seance.participants > 0 ? seance.president : "—"}
                </Definition>
                <Definition libelle="Structure">{seance.structure}</Definition>
                <Definition libelle="Compte rendu attendu">
                  {formaterDate(seance.echeanceDepot)}
                </Definition>
                <Definition libelle="Déposé le">
                  {seance.dateDepot ? formaterDate(seance.dateDepot) : "Non déposé"}
                </Definition>
              </GrilleDefinitions>

              {seance.depot === "Hors délai" && (
                <div className="mt-4">
                  <Encart ton="danger" icone="horloge">
                    Le compte rendu a dépassé son délai de transmission. Tant qu'il n'est pas
                    déposé, les décisions issues de cette séance ne sont opposables à aucune
                    structure.
                  </Encart>
                </div>
              )}
            </Carte>

            {seance.ordreDuJour.length > 0 && (
              <Carte titre="Ordre du jour">
                <ol className="mt-3.5 flex flex-col">
                  {seance.ordreDuJour.map((point, index) => (
                    <li
                      key={point.id}
                      className={`flex items-start gap-3 py-3 ${
                        index > 0 ? "border-t border-separateur" : ""
                      }`}
                    >
                      <span className="grid size-6 flex-none place-items-center rounded-none bg-surface-douce text-[11px] font-bold text-encre-douce tabular-nums">
                        {point.rang}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="text-[12.5px] leading-[1.35] font-semibold text-encre">
                          {point.point}
                        </span>
                        <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                          Rapporteur : {point.rapporteur}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Carte>
            )}

            <Carte
              titre="Décisions issues de la séance"
              aDroite={
                <span className="text-[11px] leading-none font-semibold text-encre-tenue tabular-nums">
                  {seance.decisionsIssues} au total
                </span>
              }
            >
              {seance.decisions.length === 0 ? (
                <p className="mt-3.5 text-[12px] leading-[1.5] font-medium text-encre-tenue">
                  Aucune décision rattachée. Si la séance en a produit, elles doivent être
                  enregistrées au registre pour être suivies.
                </p>
              ) : (
                <ul className="mt-3.5 flex flex-col gap-2">
                  {seance.decisions.map((decision) => (
                    <li key={decision.id}>
                      <Link
                        to={`/gouvernance/decisions/${decision.id}`}
                        className="flex items-center gap-3 rounded-none border border-bordure px-3.5 py-3 transition-colors duration-150 hover:bg-surface-douce"
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <span className="truncate text-[12px] leading-[1.35] font-semibold text-encre">
                            {decision.objet}
                          </span>
                          <span className="text-[10.5px] leading-none font-bold text-accent tabular-nums">
                            {decision.reference}
                          </span>
                        </span>
                        <Etiquette ton={TONS_ETAT[decision.etat]}>{decision.etat}</Etiquette>
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
              titre="Documents"
              aDroite={
                manquants.length > 0 ? (
                  <Etiquette ton="alerte">{manquants.length} manquant{manquants.length > 1 ? "s" : ""}</Etiquette>
                ) : undefined
              }
            >
              <ul className="mt-3.5 flex flex-col gap-2">
                {seance.documents.map((document) => (
                  <li
                    key={document.id}
                    className={`flex items-start gap-2.5 rounded-none border px-3 py-2.5 ${
                      document.depose ? "border-bordure" : "border-alerte-trait bg-alerte-voile"
                    }`}
                  >
                    <Icone
                      nom={document.depose ? "document" : "horloge"}
                      taille={15}
                      className={`mt-0.5 flex-none ${document.depose ? "text-encre-tenue" : "text-alerte"}`}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                        {document.libelle}
                      </span>
                      <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                        {document.nature}
                        {document.depose && document.dateDepot
                          ? ` · ${formaterDate(document.dateDepot)} · ${document.poids}`
                          : " · non déposé"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Carte>

            {seance.presents.length > 0 && (
              <Carte
                titre="Participants"
                aDroite={
                  <span className="text-[11px] leading-none font-semibold text-encre-tenue tabular-nums">
                    {presents} / {seance.participants}
                  </span>
                }
              >
                <ul className="mt-3.5 flex flex-col gap-2.5">
                  {seance.presents.map((personne) => (
                    <li key={personne.nom} className="flex items-center gap-2.5">
                      <Avatar initiales={personne.initiales} taille="petit" />
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                          {personne.nom}
                        </span>
                        <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                          {personne.poste}
                        </span>
                      </span>
                      {!personne.present && <Etiquette ton="neutre">Absent</Etiquette>}
                    </li>
                  ))}
                </ul>
              </Carte>
            )}
          </div>
        </div>
      </div>

      <ModaleDeposerDocument
        ouverte={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
        seanceId={seance.id}
        seanceIntitule={seance.intitule}
      />
    </>
  );
}
