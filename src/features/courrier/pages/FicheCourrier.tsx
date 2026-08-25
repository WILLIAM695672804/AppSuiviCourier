import { useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton, BoutonIcone } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Definition, GrilleDefinitions } from "@/components/ui/Definition";
import { Encart } from "@/components/ui/Encart";
import { EtatChargement, EtatErreur } from "@/components/ui/EtatChargement";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { ficheQuery } from "@/features/courrier/api";
import { actionsDisponibles } from "@/features/courrier/actionsDisponibles";
import { BlocDelai } from "@/features/courrier/components/BlocDelai";
import { Chronologie } from "@/features/courrier/components/Chronologie";
import { FilObservations } from "@/features/courrier/components/FilObservations";
import { ModaleAffectation } from "@/features/courrier/components/ModaleAffectation";
import { ModaleCorrection } from "@/features/courrier/components/ModaleCorrection";
import { ModaleCotation } from "@/features/courrier/components/ModaleCotation";
import { ModaleProlongation } from "@/features/courrier/components/ModaleProlongation";
import { PiecesJointes } from "@/features/pieces/components/PiecesJointes";
import { LIBELLE_ETAPE, statutAffiche } from "@/features/courrier/statut";
import { usePermission, useSession } from "@/lib/contexteSession";
import { formaterDateHeure } from "@/lib/format";
import { PERMISSIONS } from "@/types/habilitation";

/**
 * A-06 — consultation d'un courrier.
 *
 * Un seul ecran pour tous les postes : ce sont les actions et les blocs qui
 * varient, jamais la mise en page. Un agent qui apprend cette fiche la
 * reconnait quel que soit son role, et un responsable voit exactement ce que
 * voit son collaborateur, plus ses propres actions.
 */
const MODES_COTATION = {
  CASCADE: "Mode cascade",
  PARALLELE: "Mode parallèle",
} as const;

export function FicheCourrier() {
  const { id } = useParams();
  const naviguer = useNavigate();
  const session = useSession();
  const peutObserver = usePermission(
    PERMISSIONS.TRA,
    PERMISSIONS.COT,
    PERMISSIONS.AFF,
  );
  const peutOuvrirDossier = usePermission(PERMISSIONS.DOS_LEC);
  // Le depot d'une piece sur un courrier est ouvert par `ENR` — c'est ce que
  // declare `noyau/pieces/rattachement.py`, et le front ne doit pas proposer
  // une main que le serveur n'a pas.
  const peutDeposerPiece = usePermission(PERMISSIONS.ENR);
  // Prolonger, c'est modifier le delai que l'autorite a impose en cotant : les
  // permissions sont donc celles de la cotation, pas celles du traitement.
  const peutProlonger = usePermission(PERMISSIONS.COT, PERMISSIONS.COT_DEL);
  // Corriger une saisie relève de qui tient le registre.
  const peutCorriger = usePermission(PERMISSIONS.ENR);
  const { data, isPending, isError, error } = useQuery(ficheQuery(Number(id)));

  // « Enregistrer et coter » depose ?coter=1 : la fenetre s'ouvre d'elle-meme.
  const [parametres, setParametres] = useSearchParams();
  const [cotationOuverte, setCotationOuverte] = useState(
    parametres.get("coter") === "1",
  );

  const [affectationOuverte, setAffectationOuverte] = useState(false);
  const [prolongationOuverte, setProlongationOuverte] = useState(false);
  const [correctionOuverte, setCorrectionOuverte] = useState(false);

  // La structure pressentie a l'enregistrement pre-coche la premiere ligne de
  // la fenetre : l'agent l'a deja designee, la lui redemander serait une saisie
  // de plus au poste le plus charge de l'application.
  const structurePressentie = Number(parametres.get("structure")) || null;

  // Le depot des documents numerises suit l'enregistrement et peut echouer sans
  // que l'enregistrement echoue. Le dire ici, et non a l'ecran precedent : c'est
  // sur cette fiche que l'agent redepose.
  const piecesEnEchec = Number(parametres.get("piecesEnEchec")) || 0;

  function fermerCotation() {
    setCotationOuverte(false);
    if (parametres.has("coter")) {
      parametres.delete("coter");
      parametres.delete("structure");
      setParametres(parametres, { replace: true });
    }
  }

  if (isPending) {
    return (
      <>
        <EnTetePage titre="Courrier" miettes={[{ libelle: "Registre des arrivées", chemin: "/courriers" }]} />
        <EtatChargement message="Chargement du courrier…" />
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <EnTetePage titre="Courrier" miettes={[{ libelle: "Registre des arrivées", chemin: "/courriers" }]} />
        <EtatErreur message={error instanceof Error ? error.message : "Courrier introuvable."} />
      </>
    );
  }

  const actions = actionsDisponibles(data, session.permissions);
  const statut = statutAffiche(data);

  return (
    <>
      <EnTetePage
        titre={data.objet}
        miettes={[
          { libelle: "Registre des arrivées", chemin: "/courriers" },
          { libelle: data.numero },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Etiquette ton={statut.ton}>{LIBELLE_ETAPE[data.etape]}</Etiquette>
            {data.priorite !== "NORMALE" && (
              <Etiquette ton="alerte">
                {data.priorite === "TRES_URGENTE" ? "Très urgent" : "Urgent"}
              </Etiquette>
            )}
            {data.confidentiel && (
              <Etiquette ton="confidentiel">Confidentiel</Etiquette>
            )}

            <span className="mx-1 h-5 w-px bg-bordure" />

            {/* « Imprimer » conduit à la fiche de cotation : c'est elle qui
                s'imprime et accompagne le pli, avec la décharge du récepteur.
                Le bouton n'avait pas de gestionnaire et ne faisait rien. */}
            {actions.includes("imprimer") && (
              <BoutonIcone
                icone="imprimante"
                libelle="Fiche de cotation"
                onClick={() => naviguer(`/courriers/${data.id}/fiche-cotation`)}
              />
            )}
            {/* Corriger une saisie — sans ce geste, une erreur d'enregistrement
                est définitive et l'agent n'a que le réenregistrement, qui
                consomme un second numéro et fait deux courriers d'un seul.
                Discret : c'est un rattrapage, pas une étape du traitement. */}
            {peutCorriger && (
              <Bouton icone="reglages" onClick={() => setCorrectionOuverte(true)}>
                Corriger
              </Bouton>
            )}
            {actions.includes("affecter") && (
              <Bouton
                icone="personneAjout"
                onClick={() => setAffectationOuverte(true)}
              >
                Affecter à un agent
              </Bouton>
            )}
            {actions.includes("coter") && (
              <Bouton
                variante="doux"
                icone="document"
                onClick={() => setCotationOuverte(true)}
              >
                Coter
              </Bouton>
            )}
            {/*
              Ouvrir un dossier a partir du courrier — §3.6 du descriptif.
              Le lien est unidirectionnel : un courrier engendre un dossier,
              jamais l'inverse. Le dossier gardera la reference d'origine.

              Le bouton navigue et n'importe rien du domaine « dossier » : une
              fonctionnalite n'en appelle jamais une autre. C'est l'ecran
              d'ouverture qui connait le courrier, pas le courrier qui connait
              les dossiers.
            */}
            {peutOuvrirDossier && (
              <Bouton
                icone="document"
                onClick={() =>
                  naviguer(
                    // La référence accompagne l'identifiant : c'est elle que
                    // la fiche du dossier affichera et que les courriers
                    // citeront. Un identifiant ne se lit pas.
                    `/dossiers/nouveau?courrier=${data.id}&reference=${encodeURIComponent(
                      data.numero,
                    )}`,
                  )
                }
              >
                Ouvrir un dossier
              </Bouton>
            )}
            {actions.includes("traiter") && (
              <Bouton
                variante="principal"
                icone="coche"
                onClick={() =>
                  naviguer(`/courriers/departs?reponseA=${data.id}`)
                }
              >
                Préparer la réponse
              </Bouton>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        {piecesEnEchec > 0 && (
          <div className="mb-4">
            <Encart ton="alerte" icone="aide">
              {piecesEnEchec} document{piecesEnEchec > 1 ? "s" : ""} numérisé
              {piecesEnEchec > 1 ? "s" : ""} n'{piecesEnEchec > 1 ? "ont" : "a"} pas pu être versé
              {piecesEnEchec > 1 ? "s" : ""} après l'enregistrement. Le courrier, lui, est au
              registre : redéposez le ou les fichiers depuis le panneau « Pièces jointes ».
            </Encart>
          </div>
        )}

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Carte titre="Informations d'enregistrement">
              <GrilleDefinitions>
                <Definition libelle="Expéditeur">
                  {data.correspondant}
                </Definition>
                <Definition libelle="Référence expéditeur">
                  {data.referenceExpediteur ?? "—"}
                </Definition>
                <Definition libelle="Nature">{data.nature}</Definition>
                <Definition libelle="Session">{data.sessionLibelle}</Definition>
                <Definition libelle="Date d'arrivée">
                  {formaterDateHeure(data.dateReception)}
                </Definition>
                <Definition libelle="Enregistré par">
                  {data.enregistrePar}
                </Definition>
                <Definition libelle="Nombre de pages">
                  {data.nombrePages} page{data.nombrePages > 1 ? "s" : ""}
                  {data.nombreAnnexes > 0 &&
                    ` · ${data.nombreAnnexes} annexe${data.nombreAnnexes > 1 ? "s" : ""}`}
                </Definition>
                <Definition libelle="Délai imparti">
                  {data.delaiJours} jours ouvrables
                </Definition>
              </GrilleDefinitions>
            </Carte>

            <Carte
              titre="Cotation et affectation"
              aDroite={
                data.modeCotation && (
                  <span className="rounded-none bg-[#f2f4f7] px-2 py-[5px] text-[11px] leading-none font-semibold text-encre-faible">
                    {MODES_COTATION[data.modeCotation]}
                  </span>
                )
              }
            >
              {/* Le chef de file n'apparait pas dans la chronologie : il est
                  rappele ici, car c'est lui qui repond des delais. */}
              {data.structuresCotees.length > 1 && (
                <p className="mt-3 text-[11.5px] leading-[1.5] font-medium text-encre-faible">
                  Chef de file :{" "}
                  <span className="font-bold text-encre">
                    {data.structuresCotees[0]}
                  </span>{" "}
                  — également coté à {data.structuresCotees.slice(1).join(", ")}
                  .
                </p>
              )}
              <Chronologie etapes={data.chronologie} />
            </Carte>

            <Carte
              titre="Instructions et observations"
              aDroite={
                <span className="text-[11px] leading-none font-medium text-encre-tenue">
                  {data.observations.length} message
                  {data.observations.length > 1 ? "s" : ""}
                </span>
              }
            >
              <FilObservations
                observations={data.observations}
                peutEcrire={peutObserver}
              />
            </Carte>

            {data.reponses.length > 0 && (
              <Carte titre="Réponses rattachées">
                <div className="mt-3.5 flex flex-col gap-2.5">
                  {data.reponses.map((reponse) => (
                    <div
                      key={reponse.id}
                      className="flex items-center gap-3 rounded-none border border-bordure px-3.5 py-3"
                    >
                      <span className="grid size-[30px] flex-none place-items-center rounded-none bg-accent-voile text-accent-fonce">
                        <Icone nom="document" taille={15} epaisseur={1.6} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-[12.5px] leading-none font-semibold text-encre">
                          {reponse.objet}
                        </span>
                        <span className="text-[11px] leading-none font-medium text-encre-tenue tabular-nums">
                          {reponse.numero} · version {reponse.version} · rédigée
                          par {reponse.redigePar}
                        </span>
                      </span>
                      <Etiquette ton="accent">
                        {LIBELLE_ETAPE[reponse.etape]}
                      </Etiquette>
                      <Link
                        to={`/courriers/${reponse.id}`}
                        className="flex-none text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
                      >
                        Ouvrir
                      </Link>
                    </div>
                  ))}
                </div>
              </Carte>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <Carte
              titre="Courrier numérisé"
              aDroite={
                <span className="text-[11px] leading-none font-medium text-encre-tenue">
                  {data.nombrePages > 0
                    ? `Page 1 / ${data.nombrePages}`
                    : "Non numérisé"}
                </span>
              }
            >
              <div className="mt-3 flex justify-center rounded-none border border-bordure bg-neutre-voile p-4">
                <div className="flex w-[152px] flex-col gap-[7px] rounded-none border border-bordure bg-surface px-3.5 py-4 shadow-[0_2px_8px_rgba(16,24,40,.07)]">
                  <div className="h-[5px] w-[46%] rounded-none bg-accent-voile-fort" />
                  <div className="h-1 w-[30%] rounded-none bg-inerte" />
                  <div className="mt-2 h-1 w-full rounded-none bg-inerte" />
                  <div className="h-1 w-[92%] rounded-none bg-inerte" />
                  <div className="h-1 w-[97%] rounded-none bg-inerte" />
                  <div className="h-1 w-[58%] rounded-none bg-inerte" />
                  <div className="mt-2 h-[22px] w-full rounded-none bg-[#f2f4f7]" />
                  <div className="mt-1.5 h-1 w-[88%] rounded-none bg-inerte" />
                  <div className="h-1 w-[44%] rounded-none bg-inerte" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Bouton className="flex-1 justify-center py-2.5">Ouvrir</Bouton>
                <Bouton className="flex-1 justify-center py-2.5">
                  Télécharger
                </Bouton>
              </div>
            </Carte>

            {/* Prolonger relève de la **cotation** : le délai est imposé en
                cotant, et le reporter revient à modifier cette décision. C'est
                la garde que pose `POST /courriers/{id}/prolongation` ; le
                bouton suivait `relancer`, qui n'a rien à voir, et n'avait de
                toute façon aucun gestionnaire. */}
            <BlocDelai
              delai={data.delai}
              echeance={data.echeance}
              peutProlonger={peutProlonger}
              onProlonger={() => setProlongationOuverte(true)}
            />

            {/*
              Le panneau generique du depot — le meme qu'une activite ou un
              dossier (ADR 017). Il remplace une liste en lecture seule dont les
              liens pointaient vers `/api/pieces/{id}` : ni le chemin ni
              l'identifiant n'existaient, et aucun ecran ne permettait de verser
              le pli numerise.

              `lectureSeule` suit `ENR` parce que c'est la permission que le
              registre des rattachements exige pour ce type d'objet. Afficher le
              bouton a qui ne la porte pas ferait promettre un depot que le
              serveur refuse en 404.
            */}
            <PiecesJointes
              objetType="courrier"
              objetId={data.id}
              titre="Pièces jointes"
              lectureSeule={!peutDeposerPiece}
            />

            <Carte titre="Traçabilité">
              <div className="mt-3 flex flex-col gap-[11px]">
                {data.derniersEvenements.map((evenement, i) => (
                  <div key={evenement.id} className="flex items-center gap-2.5">
                    <span
                      className={`size-[7px] flex-none rounded-none ${i === 0 ? "bg-accent" : "bg-bordure-champ"}`}
                    />
                    <span className="flex-1 text-[11.5px] leading-[1.4] font-medium text-encre-moyenne">
                      {evenement.libelle}
                    </span>
                    <span className="text-[10.5px] leading-none font-medium whitespace-nowrap text-encre-tenue">
                      {formaterDateHeure(evenement.horodatage)}
                    </span>
                  </div>
                ))}
              </div>
            </Carte>
          </div>
        </div>
      </div>

      <ModaleCotation
        courriers={[data]}
        ouverte={cotationOuverte}
        onFermer={fermerCotation}
        structureInitiale={structurePressentie}
      />

      <ModaleAffectation
        courrier={data}
        ouverte={affectationOuverte}
        onFermer={() => setAffectationOuverte(false)}
      />

      {/* Les deux fenêtres ne sont montées qu'à l'ouverture : la correction lit
          le référentiel des natures et interroge les correspondants, deux
          requêtes qu'une fiche ouverte toute la journée n'a pas à porter. */}
      {prolongationOuverte && (
        <ModaleProlongation
          courrier={data}
          ouverte
          onFermer={() => setProlongationOuverte(false)}
        />
      )}

      {correctionOuverte && (
        <ModaleCorrection courrier={data} ouverte onFermer={() => setCorrectionOuverte(false)} />
      )}
    </>
  );
}
