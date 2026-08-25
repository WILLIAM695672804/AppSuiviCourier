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
import {
  dossierQuery,
  modelesQuery,
  useNoterReception,
  type EtatDossier,
} from "@/features/dossier/api";
import {
  ModaleDemanderComplement,
  ModaleFusion,
  ModaleRetourEtape,
} from "@/features/dossier/components/ModalesDossier";
import { PiecesJointes } from "@/features/pieces/components/PiecesJointes";
import { usePermission } from "@/lib/contexteSession";
import { formaterDate } from "@/lib/format";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * Fiche d'instruction d'un dossier.
 *
 * Trois choses distinguent cet écran de la fiche d'un courrier :
 *
 *  — le **circuit** est visible en entier, étapes franchies et à venir. Un
 *    instructeur doit savoir qui validera après lui ;
 *  — la **règle d'affectation** est écrite en toutes lettres (RF-BPM-02).
 *    Sans elle, l'affectation dynamique passe pour de l'arbitraire, et c'est
 *    le premier grief formulé contre ce genre d'outil ;
 *  — les pièces portent leurs **versions** (RF-GED-04). La version courante
 *    n'efface pas les précédentes : on doit pouvoir dire sur quoi la décision
 *    a été prise, même deux ans plus tard.
 */
const TONS_ETAT: Record<EtatDossier, TonEtiquette> = {
  "En cours": "accent",
  "En attente de complément": "alerte",
  Retourné: "alerte",
  "Hors délai": "danger",
  Clos: "succes",
};

export function FicheDossier() {
  const { id } = useParams();
  const peutInstruire = usePermission(PERMISSIONS.DOS_INS);
  /*
   * Retourner un dossier a une etape anterieure : les deux postes, pas un seul.
   *
   * Le §3.7 confie explicitement ce geste a l'agent instructeur — « faire
   * remonter un dossier a l'etape anterieure, avec motif obligatoire trace ».
   * Le reserver a DOS_VAL laissait l'instructeur sans recours devant un dossier
   * mal oriente : il ne pouvait que le garder ou le cloturer. Le motif
   * obligatoire et la trace, eux, s'appliquent aux deux de la meme maniere.
   */
  const peutRetourner = usePermission(PERMISSIONS.DOS_INS, PERMISSIONS.DOS_VAL);
  const [modale, setModale] = useState<"complement" | "retour" | "fusion" | null>(null);
  const [pieceOuverte, setPieceOuverte] = useState<number | null>(null);
  const noterReception = useNoterReception();

  const { data: dossier } = useQuery(dossierQuery(Number(id)));
  const { data: bibliotheque } = useQuery(modelesQuery());

  if (!dossier) {
    return (
      <>
        <EnTetePage titre="Dossier" miettes={[{ libelle: "Dossiers", chemin: "/dossiers" }]} />
        <EtatChargement message="Ouverture du dossier…" />
      </>
    );
  }

  const complementsEnAttente = dossier.complements.filter((c) => c.recuLe === null);

  return (
    <>
      <EnTetePage
        titre={dossier.objet}
        sousTitre={`${dossier.reference} · ${dossier.type} · ${dossier.demandeur}`}
        miettes={[
          { libelle: "Dossiers à instruire", chemin: "/dossiers" },
          { libelle: dossier.reference },
        ]}
        actions={
          dossier.etat === "Clos" ? undefined : (
            <>
              {peutInstruire && (
                <>
                  <Bouton icone="aide" onClick={() => setModale("complement")}>
                    Demander un complément
                  </Bouton>
                  <Bouton icone="document" onClick={() => setModale("fusion")}>
                    Générer un courrier
                  </Bouton>
                </>
              )}
              {peutRetourner && (
                <Bouton
                  variante="principal"
                  icone="chevronGauche"
                  onClick={() => setModale("retour")}
                >
                  Retourner à une étape antérieure
                </Bouton>
              )}
            </>
          )
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_372px]">
          <div className="flex min-w-0 flex-col gap-3.5">
            <Carte
              titre="Le dossier"
              aDroite={<Etiquette ton={TONS_ETAT[dossier.etat]}>{dossier.etat}</Etiquette>}
            >
              <p className="mt-3 text-[12.5px] leading-[1.55] font-medium text-encre-moyenne">
                {dossier.contexte}
              </p>

              <GrilleDefinitions>
                <Definition libelle="Demandeur">{dossier.demandeur}</Definition>
                <Definition libelle="Structure instructrice">{dossier.structure}</Definition>
                <Definition libelle="Ouvert le">{formaterDate(dossier.ouvertLe)}</Definition>
                <Definition libelle="Échéance">
                  {formaterDate(dossier.echeance)}
                  {dossier.etat !== "Clos" && dossier.joursRestants < 0 && (
                    <span className="ml-2 font-bold text-danger">
                      {-dossier.joursRestants} j de retard
                    </span>
                  )}
                </Definition>
                <Definition libelle="Criticité">{dossier.criticite}</Definition>
                <Definition libelle="Courrier d'origine">
                  {dossier.courrierOrigineId ? (
                    <Link
                      to={`/courriers/${dossier.courrierOrigineId}`}
                      className="font-bold text-accent hover:underline"
                    >
                      {dossier.courrierOrigine}
                    </Link>
                  ) : (
                    "Dépôt direct"
                  )}
                </Definition>
              </GrilleDefinitions>

              <div className="mt-4 border-t border-separateur pt-4">
                <Definition libelle="Pourquoi ce dossier vous est affecté">
                  {dossier.regleAffectation}
                </Definition>
                {dossier.seuil && (
                  <p className="mt-2 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                    Seuil applicable : {dossier.seuil}.
                  </p>
                )}
              </div>
            </Carte>

            <Carte titre="Circuit d'instruction">
              <ol className="mt-3.5 flex flex-col">
                {dossier.etapes.map((etape, index) => {
                  const courante = etape.code === dossier.etape;
                  return (
                    <li
                      key={etape.code}
                      className={`flex items-start gap-3 py-3 ${
                        index > 0 ? "border-t border-separateur" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid size-5 flex-none place-items-center rounded-none border ${
                          etape.franchie
                            ? "border-succes bg-succes-voile text-succes"
                            : courante
                              ? "border-accent bg-accent-voile text-accent"
                              : "border-bordure-forte text-encre-tenue"
                        }`}
                      >
                        {etape.franchie ? (
                          <Icone nom="coche" taille={11} epaisseur={2.2} />
                        ) : courante ? (
                          <span className="size-1.5 rounded-none bg-accent" />
                        ) : null}
                      </span>

                      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span
                          className={`text-[12.5px] leading-[1.35] ${
                            courante ? "font-bold text-encre" : "font-semibold text-encre-douce"
                          }`}
                        >
                          {etape.libelle}
                        </span>
                        <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                          {etape.acteur ?? "Acteur non désigné"}
                          {etape.date ? ` · ${formaterDate(etape.date)}` : ""}
                        </span>
                      </span>

                      {courante && <Etiquette ton="accent">Étape courante</Etiquette>}
                    </li>
                  );
                })}
              </ol>
            </Carte>

            <Carte
              titre="Pièces du dossier"
              aDroite={
                <span className="text-[11px] leading-none font-semibold text-encre-tenue tabular-nums">
                  {dossier.pieces.length}
                </span>
              }
            >
              {dossier.pieces.length === 0 ? (
                <p className="mt-3.5 text-[12px] font-medium text-encre-tenue">
                  Aucune pièce au dossier.
                </p>
              ) : (
                <ul className="mt-3.5 flex flex-col gap-2">
                  {dossier.pieces.map((piece) => {
                    const courante = piece.versions.find((v) => v.courante);
                    const depliee = pieceOuverte === piece.id;

                    return (
                      <li key={piece.id} className="rounded-none border border-bordure">
                        <button
                          type="button"
                          onClick={() => setPieceOuverte(depliee ? null : piece.id)}
                          className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-3 text-left transition-colors duration-150 hover:bg-surface-douce"
                        >
                          <Icone
                            nom="document"
                            taille={15}
                            className="flex-none text-encre-tenue"
                          />
                          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <span className="truncate text-[12px] leading-none font-semibold text-encre">
                              {piece.nom}
                            </span>
                            <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                              version {courante?.version} · {courante?.deposeLe} ·{" "}
                              {courante?.deposePar}
                            </span>
                          </span>
                          {piece.versions.length > 1 && (
                            <span className="flex-none rounded-none bg-surface-douce px-1.5 py-0.5 text-[9.5px] leading-none font-bold text-encre-faible">
                              {piece.versions.length} VERSIONS
                            </span>
                          )}
                          <Icone
                            nom={depliee ? "chevronHaut" : "chevronBas"}
                            taille={12}
                            className="flex-none text-encre-tenue"
                          />
                        </button>

                        {depliee && (
                          <ul className="border-t border-separateur px-3.5 py-2">
                            {[...piece.versions].reverse().map((version) => (
                              <li
                                key={version.version}
                                className="flex items-center gap-2.5 py-1.5"
                              >
                                <span
                                  className={`w-16 flex-none text-[10.5px] leading-none font-bold tabular-nums ${
                                    version.courante ? "text-accent" : "text-encre-tenue"
                                  }`}
                                >
                                  v{version.version}
                                  {version.courante ? " · en vigueur" : ""}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[11px] leading-none font-medium text-encre-moyenne">
                                  {formaterDate(version.deposeLe)} · {version.deposePar}
                                </span>
                                <span className="flex-none text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
                                  {version.taille}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              <p className="mt-3 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                Une version remplacée reste consultable : c'est ce qui permet de dire, plus tard,
                sur quelle pièce la décision a été prise.
              </p>
            </Carte>
          </div>

          <div className="flex min-w-0 flex-col gap-3.5">
            {complementsEnAttente.length > 0 && (
              <Carte
                titre="Compléments attendus"
                aDroite={<Etiquette ton="alerte">{complementsEnAttente.length}</Etiquette>}
              >
                <ul className="mt-3.5 flex flex-col gap-2.5">
                  {complementsEnAttente.map((complement) => (
                    <li
                      key={complement.id}
                      className="flex flex-col gap-1.5 rounded-none border border-alerte-trait bg-alerte-voile px-3.5 py-3"
                    >
                      <span className="text-[11.5px] leading-[1.5] font-semibold text-encre">
                        {complement.objet}
                      </span>
                      <span className="text-[10.5px] leading-none font-medium text-encre-moyenne">
                        demandé le {formaterDate(complement.demandeLe)} · attendu pour le{" "}
                        {formaterDate(complement.echeance)}
                      </span>
                      {peutInstruire && (
                        <span className="mt-1 flex">
                          <Bouton
                            icone="coche"
                            chargement={noterReception.isPending}
                            onClick={() =>
                              noterReception.mutate({
                                dossierId: dossier.id,
                                complementId: complement.id,
                              })
                            }
                          >
                            Pièce reçue
                          </Bouton>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-3.5">
                  <Encart ton="alerte" icone="horloge">
                    Le délai du dossier court malgré l'attente. Passée l'échéance du complément, il
                    peut être clos sans suite.
                  </Encart>
                </div>
              </Carte>
            )}

            <Carte titre="Historique">
              <p className="mt-2.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                Rien ne s'efface, pas même un retour en arrière.
              </p>

              <ul className="mt-3.5 flex flex-col gap-3.5">
                {[...dossier.historique].reverse().map((evenement) => (
                  <li key={evenement.id} className="flex gap-2.5">
                    <Avatar initiales={evenement.initiales} taille="petit" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <Etiquette
                          ton={
                            evenement.type === "Retour à l'étape antérieure"
                              ? "alerte"
                              : evenement.type === "Validation" || evenement.type === "Clôture"
                                ? "succes"
                                : "neutre"
                          }
                        >
                          {evenement.type}
                        </Etiquette>
                        <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                          {formaterDate(evenement.date)}
                        </span>
                      </span>

                      {evenement.etapeAvant && evenement.etapeApres && (
                        <span className="text-[10.5px] leading-none font-bold text-encre-faible">
                          {evenement.etapeAvant} → {evenement.etapeApres}
                        </span>
                      )}

                      <span className="text-[11.5px] leading-[1.5] font-medium text-encre-moyenne">
                        {evenement.texte}
                      </span>
                      <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                        {evenement.auteur} — {evenement.poste}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Carte>

            {/* Les pièces du dossier, avec leur binaire — RF-GED-04 et
                RF-GED-09. `DOS_INS` porte le dépôt : verser une pièce à un
                dossier est un acte d'instruction, pas de lecture. */}
            <PiecesJointes objetType="dossier" objetId={dossier.id} lectureSeule={!peutInstruire} />
          </div>
        </div>
      </div>

      <ModaleDemanderComplement
        ouverte={modale === "complement"}
        onFermer={() => setModale(null)}
        dossier={dossier}
      />
      <ModaleRetourEtape
        ouverte={modale === "retour"}
        onFermer={() => setModale(null)}
        dossier={dossier}
      />
      <ModaleFusion
        ouverte={modale === "fusion"}
        onFermer={() => setModale(null)}
        dossier={dossier}
        modeles={bibliotheque?.modeles ?? []}
      />
    </>
  );
}
