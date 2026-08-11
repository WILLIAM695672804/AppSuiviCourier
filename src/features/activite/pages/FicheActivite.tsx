import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
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
  ModaleAvancementActivite,
  ModaleIndicateurActivite,
  ModaleInstructionActivite,
  ModaleLeveeInstruction,
  ModaleModifierActivite,
  ModalePieceVie,
  ModaleRelanceActivite,
  ModaleReleveIndicateur,
  ModaleSuspensionActivite,
  ModaleTacheActivite,
} from "@/features/activite/components/ModalesActivite";
import {
  activiteQuery,
  type EtatActivite,
  type IndicateurActivite,
  type InstructionActivite,
  type TypeEvenementVie,
} from "@/features/activite/api";
import { axeComplet } from "@/lib/axesStrategiques";
import { usePermission } from "@/lib/contexteSession";
import { formaterDate } from "@/lib/format";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * Fiche d'une activité, et sa fiche de vie — §15 et §18 du cahier des charges.
 *
 * Les indicateurs portent trois valeurs et non une : l'état de référence, la
 * cible et le réalisé. C'est le cahier des charges qui l'impose, et il a
 * raison — « 64 % » ne veut rien dire tant qu'on ignore d'où l'on part.
 *
 * La fiche de vie mélange volontairement les instructions verbales du Directeur
 * général, les décisions des instances et les observations : ce sont trois
 * sources d'infléchissement d'une même activité, et c'est leur enchaînement
 * dans le temps qui explique pourquoi une échéance a bougé.
 *
 * Les instructions ouvertes sont pourtant sorties de la fiche de vie et
 * remontées dans leur propre carte. La raison est simple : la fiche de vie
 * raconte ce qui s'est passé, l'instruction dit ce qui reste dû. Noyée dans la
 * chronologie, une instruction avec un délai au 31 août se serait perdue sous
 * les observations de septembre.
 *
 * Les actions sont réparties selon qui les porte, plutôt que rassemblées en
 * barre d'outils : la structure déclare en tête, l'autorité suspend et instruit
 * depuis la carte des instructions, la DSR relance depuis l'en-tête. Un écran
 * où tout le monde voit les boutons de tout le monde ne dit plus qui fait quoi.
 */
const TONS_ETAT: Record<EtatActivite, TonEtiquette> = {
  Programmée: "neutre",
  "En cours": "accent",
  Réalisée: "succes",
  "En retard": "danger",
  Suspendue: "confidentiel",
};

const TONS_VIE: Record<TypeEvenementVie, TonEtiquette> = {
  Création: "neutre",
  Modification: "neutre",
  "Instruction verbale": "alerte",
  "Décision du DG": "confidentiel",
  Observation: "accent",
  Relance: "danger",
  Validation: "succes",
  "Pièce jointe": "neutre",
};

const MONNAIE = new Intl.NumberFormat("fr-FR");

type ModaleOuverte =
  | { nom: "avancement" }
  | { nom: "modifier" }
  | { nom: "indicateur" }
  | { nom: "releve"; indicateur: IndicateurActivite }
  | { nom: "tache" }
  | { nom: "piece" }
  | { nom: "suspension"; action: "suspendre" | "reprendre" }
  | { nom: "instruction" }
  | { nom: "levee"; instruction: InstructionActivite }
  | { nom: "relance" }
  | null;

export function FicheActivite() {
  const { id } = useParams();
  const peutSaisir = usePermission(PERMISSIONS.ACT_SAI);
  const peutDecider = usePermission(PERMISSIONS.DEC);
  const peutRelancer = usePermission(PERMISSIONS.REL);
  const [modale, setModale] = useState<ModaleOuverte>(null);
  const { data: activite } = useQuery(activiteQuery(Number(id)));

  if (!activite) {
    return (
      <>
        <EnTetePage titre="Activité" miettes={[{ libelle: "Activités", chemin: "/activites" }]} />
        <EtatChargement message="Ouverture de l'activité…" />
      </>
    );
  }

  const ecart = activite.avancement - activite.avancementAttendu;
  const suspendue = activite.etat === "Suspendue";
  const instructionsOuvertes = activite.instructionsRattachees.filter((i) => !i.levee);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return (
    <>
      <EnTetePage
        titre={activite.intitule}
        sousTitre={`${activite.reference} · ${activite.structureLibelle}`}
        miettes={[
          { libelle: "Activités des structures", chemin: "/activites" },
          { libelle: activite.reference },
        ]}
        actions={
          <>
            {peutRelancer && !suspendue && activite.etat !== "Réalisée" && (
              <Bouton icone="cloche" onClick={() => setModale({ nom: "relance" })}>
                Relancer
              </Bouton>
            )}
            {peutSaisir && (
              <Bouton icone="reglages" onClick={() => setModale({ nom: "modifier" })}>
                Modifier
              </Bouton>
            )}
            {peutSaisir && !suspendue && (
              <Bouton
                variante="principal"
                icone="coche"
                onClick={() => setModale({ nom: "avancement" })}
              >
                Déclarer un avancement
              </Bouton>
            )}
          </>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_372px]">
          <div className="flex min-w-0 flex-col gap-3.5">
            <Carte
              titre="L'activité"
              aDroite={
                <span className="flex items-center gap-2">
                  {/* §20 : le tableau de bord du DG isole les « activités
                      critiques ». La marque se pose ici, à la source, et non
                      dans le seul cockpit — sinon la structure ne sait pas
                      qu'elle est remontée. */}
                  {activite.critique && <Etiquette ton="danger">Critique</Etiquette>}
                  <Etiquette ton={TONS_ETAT[activite.etat]}>{activite.etat}</Etiquette>
                </span>
              }
            >
              <p className="mt-3 text-[12.5px] leading-[1.55] font-semibold text-encre">
                {activite.objectif}
              </p>

              <GrilleDefinitions>
                {/* La fiche porte l'énoncé officiel ; les registres se contentent
                    du libellé court, faute de place. */}
                <Definition libelle="Axe stratégique">{axeComplet(activite.axe)}</Definition>
                <Definition libelle="Responsable">{activite.responsable}</Definition>
                <Definition libelle="Période d'exécution">
                  {formaterDate(activite.debut)} → {formaterDate(activite.fin)}
                </Definition>
                <Definition libelle="Budget validé">
                  {activite.budgetValide === null
                    ? "Sans budget dédié"
                    : `${MONNAIE.format(activite.budgetValide)} F CFA`}
                </Definition>
              </GrilleDefinitions>

              <div className="mt-4 flex flex-col gap-3 border-t border-separateur pt-4">
                <Definition libelle="État de référence">{activite.etatReferenceGeneral}</Definition>
                <Definition libelle="Résultats attendus">{activite.resultatsAttendus}</Definition>
              </div>

              <div className="mt-4 border-t border-separateur pt-4">
                <span className="text-[10.5px] leading-none font-semibold tracking-[.5px] text-encre-tenue uppercase">
                  Avancement au regard de l'attendu
                </span>
                <div className="mt-2.5">
                  <BarreProgression
                    taux={activite.avancement}
                    cible={activite.avancementAttendu}
                    niveau={activite.feu}
                  />
                </div>
                <p className="mt-2 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                  {ecart >= 0
                    ? `En avance de ${ecart} points sur le rythme prévu à cette date.`
                    : `En retard de ${-ecart} points sur le rythme prévu à cette date.`}{" "}
                  Le repère sur la barre marque l'avancement attendu au {formaterDate(new Date().toISOString())}.
                </p>
              </div>

              {suspendue && activite.suspension && (
                <div className="mt-3.5">
                  <Encart ton="confidentiel" icone="horloge">
                    Activité suspendue le {formaterDate(activite.suspension.date)} par{" "}
                    {activite.suspension.decidePar}
                    {activite.suspension.reference ? ` (${activite.suspension.reference})` : ""} :{" "}
                    {activite.suspension.motif} Aucun retard n'est décompté et aucune relance n'est
                    envoyée tant que la suspension n'est pas levée.
                  </Encart>
                </div>
              )}
            </Carte>

            <Carte
              titre="Indicateurs"
              aDroite={
                peutSaisir ? (
                  <Bouton icone="plus" onClick={() => setModale({ nom: "indicateur" })}>
                    Ajouter
                  </Bouton>
                ) : undefined
              }
            >
              {activite.indicateurs.length === 0 ? (
                <p className="mt-3 text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
                  Aucun indicateur posé. Sans indicateur, l'avancement déclaré ne repose sur rien
                  de mesurable et le §15 du cahier des charges n'est pas satisfait.
                </p>
              ) : (
                <ul className="mt-3.5 flex flex-col">
                  {activite.indicateurs.map((indicateur, index) => (
                    <li
                      key={indicateur.id}
                      className={`flex flex-col gap-2.5 py-3.5 ${
                        index > 0 ? "border-t border-separateur" : ""
                      }`}
                    >
                      <span className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[12.5px] leading-[1.35] font-semibold text-encre">
                          {indicateur.libelle}
                        </span>
                        <span className="flex-none text-[11px] leading-none font-medium text-encre-tenue tabular-nums">
                          référence {indicateur.etatReference} {indicateur.unite} · cible{" "}
                          {indicateur.cible} {indicateur.unite}
                        </span>
                      </span>

                      <span className="flex items-center gap-3">
                        {indicateur.taux === null ? (
                          <span className="min-w-0 flex-1 text-[11.5px] leading-none font-semibold text-encre-tenue">
                            Non encore mesuré
                          </span>
                        ) : (
                          <>
                            <span className="w-[86px] flex-none text-[13px] leading-none font-bold text-encre tabular-nums">
                              {indicateur.realise} {indicateur.unite}
                            </span>
                            <span className="min-w-0 flex-1">
                              <BarreProgression taux={indicateur.taux} />
                            </span>
                          </>
                        )}

                        {peutSaisir && (
                          <span className="flex-none">
                            <Bouton
                              icone="cible"
                              onClick={() => setModale({ nom: "releve", indicateur })}
                            >
                              Relever
                            </Bouton>
                          </span>
                        )}
                      </span>

                      {indicateur.releveLe && (
                        <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                          Dernier relevé le {formaterDate(indicateur.releveLe)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Carte>

            <Carte
              titre="Tâches à réaliser"
              aDroite={
                <span className="flex items-center gap-2.5">
                  <span className="text-[11px] leading-none font-semibold text-encre-tenue tabular-nums">
                    {activite.tachesFaites} / {activite.tachesTotal}
                  </span>
                  {peutSaisir && (
                    <Bouton icone="plus" onClick={() => setModale({ nom: "tache" })}>
                      Ajouter
                    </Bouton>
                  )}
                </span>
              }
            >
              {activite.taches.length === 0 ? (
                <p className="mt-3 text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
                  Aucune tâche inscrite.
                </p>
              ) : (
                <ul className="mt-3.5 flex flex-col">
                  {activite.taches.map((tache, index) => {
                    const enRetard = !tache.fait && tache.echeance < aujourdhui;
                    const enRetardDeDepot =
                      tache.fait &&
                      tache.dateRealisation !== null &&
                      tache.dateRealisation > tache.echeance;

                    return (
                      <li
                        key={tache.id}
                        className={`flex items-start gap-3 py-3 ${
                          index > 0 ? "border-t border-separateur" : ""
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid size-5 flex-none place-items-center rounded-none border ${
                            tache.fait
                              ? "border-succes bg-succes-voile text-succes"
                              : enRetard
                                ? "border-danger-trait bg-danger-voile text-danger"
                                : "border-bordure-forte text-encre-tenue"
                          }`}
                        >
                          {tache.fait ? <Icone nom="coche" taille={11} epaisseur={2.2} /> : null}
                        </span>

                        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <span className="text-[12.5px] leading-[1.35] font-semibold text-encre">
                            {tache.libelle}
                          </span>
                          <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                            {tache.responsable} · échéance {formaterDate(tache.echeance)}
                            {tache.fait && tache.dateRealisation
                              ? ` · fait le ${formaterDate(tache.dateRealisation)}`
                              : ""}
                          </span>
                        </span>

                        {enRetard && <Etiquette ton="danger">En retard</Etiquette>}
                        {enRetardDeDepot && <Etiquette ton="alerte">Hors délai</Etiquette>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Carte>
          </div>

          <div className="flex min-w-0 flex-col gap-3.5">
            {/*
              Instructions et décisions — §17 et §19.
              Elles ne sont pas saisies par la structure : le Directeur général
              décide, la DSR consigne. D'où `DEC` sur les deux boutons.
            */}
            <Carte
              titre="Instructions et décisions"
              aDroite={
                peutDecider ? (
                  <span className="flex items-center gap-2">
                    {suspendue ? (
                      <Bouton
                        icone="coche"
                        onClick={() => setModale({ nom: "suspension", action: "reprendre" })}
                      >
                        Reprendre
                      </Bouton>
                    ) : (
                      <Bouton
                        icone="horloge"
                        onClick={() => setModale({ nom: "suspension", action: "suspendre" })}
                      >
                        Suspendre
                      </Bouton>
                    )}
                    <Bouton icone="plus" onClick={() => setModale({ nom: "instruction" })}>
                      Rattacher
                    </Bouton>
                  </span>
                ) : undefined
              }
            >
              {activite.instructionsRattachees.length === 0 ? (
                <p className="mt-2.5 text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
                  Aucune instruction ne pèse sur cette activité.
                </p>
              ) : (
                <>
                  <p className="mt-2.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                    {instructionsOuvertes.length === 0
                      ? "Toutes les instructions ont été levées."
                      : `${instructionsOuvertes.length} instruction${
                          instructionsOuvertes.length > 1 ? "s" : ""
                        } encore due${instructionsOuvertes.length > 1 ? "s" : ""}.`}
                  </p>

                  <ul className="mt-3 flex flex-col">
                    {activite.instructionsRattachees.map((instruction, index) => {
                      const enRetard = !instruction.levee && instruction.echeance < aujourdhui;

                      return (
                        <li
                          key={instruction.id}
                          className={`flex flex-col gap-2 py-3 ${
                            index > 0 ? "border-t border-separateur" : ""
                          }`}
                        >
                          <span className="flex flex-wrap items-center gap-2">
                            <Etiquette ton={instruction.levee ? "succes" : enRetard ? "danger" : "alerte"}>
                              {instruction.levee ? "Levée" : enRetard ? "Délai dépassé" : "Due"}
                            </Etiquette>
                            <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                              {instruction.reference ?? instruction.origine} ·{" "}
                              {formaterDate(instruction.date)}
                            </span>
                          </span>

                          <span className="text-[11.5px] leading-[1.5] font-medium text-encre-moyenne">
                            {instruction.texte}
                          </span>

                          <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                            {instruction.responsable} · délai au {formaterDate(instruction.echeance)}
                            {instruction.levee && instruction.dateLevee
                              ? ` · levée le ${formaterDate(instruction.dateLevee)}`
                              : ""}
                          </span>

                          {!instruction.levee && peutDecider && (
                            <span className="mt-0.5">
                              <Bouton
                                icone="coche"
                                onClick={() => setModale({ nom: "levee", instruction })}
                              >
                                Lever
                              </Bouton>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </Carte>

            <Carte
              titre="Fiche de vie"
              aDroite={
                <span className="flex items-center gap-2">
                  {activite.instructions > 0 && (
                    <Etiquette ton="alerte">
                      {activite.instructions} instruction{activite.instructions > 1 ? "s" : ""}
                    </Etiquette>
                  )}
                  {peutSaisir && (
                    <Bouton icone="document" onClick={() => setModale({ nom: "piece" })}>
                      Joindre
                    </Bouton>
                  )}
                </span>
              }
            >
              <p className="mt-2.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                Création, modifications, instructions verbales, décisions, observations, relances,
                validations et pièces jointes — dans l'ordre où elles sont survenues.
              </p>

              <ul className="mt-3.5 flex flex-col gap-3.5">
                {[...activite.vie].reverse().map((evenement) => (
                  <li key={evenement.id} className="flex gap-2.5">
                    <Avatar initiales={evenement.initiales} taille="petit" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <Etiquette ton={TONS_VIE[evenement.type]}>{evenement.type}</Etiquette>
                        <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                          {formaterDate(evenement.date)}
                        </span>
                      </span>
                      <span className="text-[11.5px] leading-[1.5] font-medium text-encre-moyenne">
                        {evenement.texte}
                      </span>

                      {evenement.pieces.length > 0 && (
                        <span className="flex flex-col gap-1">
                          {evenement.pieces.map((piece) => (
                            <span
                              key={piece.id}
                              className="flex items-center gap-1.5 text-[10.5px] leading-none font-semibold text-accent"
                            >
                              <Icone nom="document" taille={12} />
                              {piece.nom}
                              <span className="font-medium text-encre-tenue">{piece.poids}</span>
                            </span>
                          ))}
                        </span>
                      )}

                      <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                        {evenement.auteur} — {evenement.poste}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Carte>
          </div>
        </div>
      </div>

      <ModaleAvancementActivite
        ouverte={modale?.nom === "avancement"}
        onFermer={() => setModale(null)}
        activite={activite}
      />
      {modale?.nom === "modifier" && (
        <ModaleModifierActivite ouverte onFermer={() => setModale(null)} activite={activite} />
      )}
      <ModaleIndicateurActivite
        ouverte={modale?.nom === "indicateur"}
        onFermer={() => setModale(null)}
        activite={activite}
      />
      <ModaleReleveIndicateur
        ouverte={modale?.nom === "releve"}
        onFermer={() => setModale(null)}
        activite={activite}
        indicateur={modale?.nom === "releve" ? modale.indicateur : null}
      />
      <ModaleTacheActivite
        ouverte={modale?.nom === "tache"}
        onFermer={() => setModale(null)}
        activite={activite}
      />
      <ModalePieceVie
        ouverte={modale?.nom === "piece"}
        onFermer={() => setModale(null)}
        activite={activite}
      />
      {modale?.nom === "suspension" && (
        <ModaleSuspensionActivite
          ouverte
          onFermer={() => setModale(null)}
          activite={activite}
          action={modale.action}
        />
      )}
      <ModaleInstructionActivite
        ouverte={modale?.nom === "instruction"}
        onFermer={() => setModale(null)}
        activite={activite}
      />
      <ModaleLeveeInstruction
        ouverte={modale?.nom === "levee"}
        onFermer={() => setModale(null)}
        activiteId={activite.id}
        instruction={modale?.nom === "levee" ? modale.instruction : null}
      />
      <ModaleRelanceActivite
        ouverte={modale?.nom === "relance"}
        onFermer={() => setModale(null)}
        activite={activite}
      />
    </>
  );
}
