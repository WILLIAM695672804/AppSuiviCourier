import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { Bouton } from "@/components/ui/Bouton";
import { EtatChargement } from "@/components/ui/EtatChargement";
import { Carte } from "@/components/ui/Carte";
import { ChampTexteLong } from "@/components/ui/ChampTexteLong";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { ZoneDepot, type FichierDepose } from "@/components/ui/ZoneDepot";
import {
  demandeQuery,
  useRepondre,
  type EtatDemandeUsager,
} from "@/features/portail/api";
import { formaterDate } from "@/lib/format";

/**
 * Suivi d'une demande — §3.13, premier point.
 *
 * L'écran répond à la seule question que l'usager se pose : où en est mon
 * dossier, et ai-je quelque chose à faire.
 *
 * D'où l'ordre. Si un complément est attendu, il occupe le haut de l'écran
 * avec le formulaire pour y répondre — pas un lien vers un formulaire, le
 * formulaire lui-même. Sinon, c'est la frise d'avancement qui vient en
 * premier.
 *
 * Chaque étape porte une explication rédigée pour l'usager. « À l'étude » ne
 * dit rien à qui ne connaît pas l'institution ; « le service juridique examine
 * votre dossier, vous serez averti si une pièce est nécessaire » lui dit à la
 * fois ce qui se passe et ce qu'il doit surveiller.
 */
const TONS_ETAT: Record<EtatDemandeUsager, TonEtiquette> = {
  Déposée: "neutre",
  "À l'étude": "accent",
  "Complément attendu": "danger",
  "Décision rendue": "succes",
  Close: "succes",
};

export function SuiviDemande() {
  const { id } = useParams();
  const [texte, setTexte] = useState("");
  const [fichiers, setFichiers] = useState<FichierDepose[]>([]);

  const { data: demande } = useQuery(demandeQuery(Number(id)));
  const repondre = useRepondre();

  if (!demande) {
    return <EtatChargement message="Ouverture de votre demande…" />;
  }

  function envoyer() {
    if (!demande || (!texte.trim() && fichiers.length === 0)) return;

    repondre.mutate(
      {
        demandeId: demande.id,
        texte: texte.trim() || "Pièces transmises.",
        pieces: fichiers.map((f) => ({ nom: f.nom, taille: f.taille })),
      },
      {
        onSuccess: () => {
          setTexte("");
          setFichiers([]);
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        to="/portail"
        className="flex w-fit items-center gap-1.5 text-[12.5px] leading-none font-semibold text-accent hover:underline"
      >
        <Icone nom="chevronGauche" taille={13} />
        Retour à mes demandes
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <Etiquette ton={TONS_ETAT[demande.etat]}>{demande.etat}</Etiquette>
          <span className="text-[12px] leading-none font-semibold text-encre-tenue tabular-nums">
            {demande.reference}
          </span>
        </div>
        <h1 className="text-[24px] leading-tight font-extrabold tracking-[-.5px] text-encre">
          {demande.objet}
        </h1>
        <p className="text-[13px] leading-[1.55] font-medium text-encre-faible">
          Déposée le {formaterDate(demande.deposeeLe)}
          {demande.etat === "Close"
            ? " · dossier clos"
            : ` · réponse attendue avant le ${formaterDate(demande.reponseAttendueLe)}`}
          {demande.serviceInstructeur !== "En cours d'affectation" &&
            ` · instruite par : ${demande.serviceInstructeur}`}
        </p>
      </div>

      {/* Ce qu'on attend de l'usager passe avant tout le reste. */}
      {demande.complementAttendu && (
        <Carte titre="Une pièce vous est demandée">
          <div className="mt-3.5 flex flex-col gap-4">
            <Encart ton="danger" icone="cloche">
              {demande.complementAttendu.objet}
              <br />
              <strong>
                À transmettre avant le{" "}
                {formaterDate(demande.complementAttendu.avantLe)}.
              </strong>{" "}
              Sans ces éléments, votre dossier ne peut pas avancer.
            </Encart>

            <ZoneDepot
              libelle="Vos pièces"
              fichiers={fichiers}
              onChange={setFichiers}
              aide="Formats acceptés : PDF, Word, images. Plusieurs fichiers possibles."
            />

            <ChampTexteLong
              libelle="Message (facultatif)"
              placeholder="Une précision à joindre à votre envoi."
              rows={3}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
            />

            <div>
              <Bouton
                variante="principal"
                icone="exporter"
                chargement={repondre.isPending}
                disabled={fichiers.length === 0}
                onClick={envoyer}
              >
                {repondre.isPending
                  ? "Envoi en cours…"
                  : "Transmettre mes pièces"}
              </Bouton>
            </div>
          </div>
        </Carte>
      )}

      <Carte titre="Où en est votre demande">
        <ol className="mt-4 flex flex-col">
          {demande.etapes.map((etape, index) => {
            const courante =
              !etape.franchie && demande.etapes[index - 1]?.franchie !== false;

            return (
              <li key={etape.libelle} className="flex gap-3.5">
                <span className="flex flex-none flex-col items-center">
                  <span
                    className={`grid size-7 place-items-center rounded-none border-2 ${
                      etape.franchie
                        ? "border-succes bg-succes-voile text-succes"
                        : courante
                          ? "border-accent bg-accent-voile text-accent"
                          : "border-bordure-forte text-encre-tenue"
                    }`}
                  >
                    {etape.franchie ? (
                      <Icone nom="coche" taille={13} epaisseur={2.4} />
                    ) : courante ? (
                      <span className="size-2 rounded-none bg-accent" />
                    ) : null}
                  </span>
                  {index < demande.etapes.length - 1 && (
                    <span
                      className={`w-0.5 flex-1 ${etape.franchie ? "bg-succes-trait" : "bg-bordure"}`}
                    />
                  )}
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-1.5 pb-6">
                  <span className="flex flex-wrap items-baseline gap-2.5">
                    <span
                      className={`text-[14px] leading-snug ${
                        courante
                          ? "font-extrabold text-encre"
                          : "font-bold text-encre-douce"
                      }`}
                    >
                      {etape.libelle}
                    </span>
                    {etape.date && (
                      <span className="text-[11.5px] leading-none font-medium text-encre-tenue tabular-nums">
                        {formaterDate(etape.date)}
                      </span>
                    )}
                  </span>
                  <span className="text-[12.5px] leading-[1.55] font-medium text-encre-faible">
                    {etape.explication}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </Carte>

      <Carte titre="Échanges avec le service">
        {demande.messages.length === 0 ? (
          <p className="mt-3.5 text-[12.5px] font-medium text-encre-tenue">
            Aucun échange pour l'instant. Le service vous écrira ici s'il a
            besoin d'une précision.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {demande.messages.map((message) => (
              <li
                key={message.id}
                className={`flex flex-col gap-2 rounded-none px-4 py-3.5 ${
                  message.auteur === "Vous"
                    ? "bg-accent-voile"
                    : "border border-bordure bg-surface-douce"
                }`}
              >
                <span className="flex flex-wrap items-baseline gap-2.5">
                  <span className="text-[12.5px] leading-none font-bold text-encre">
                    {message.nom}
                  </span>
                  <span className="text-[11px] leading-none font-medium text-encre-tenue tabular-nums">
                    {formaterDate(message.date)}
                  </span>
                </span>

                <span className="text-[12.5px] leading-[1.6] font-medium text-encre-douce">
                  {message.texte}
                </span>

                {message.pieces.length > 0 && (
                  <span className="mt-1 flex flex-wrap gap-2">
                    {message.pieces.map((piece) => (
                      <span
                        key={piece.nom}
                        className="flex items-center gap-1.5 rounded-none border border-bordure bg-surface px-2.5 py-1.5"
                      >
                        <Icone
                          nom="document"
                          taille={13}
                          className="text-encre-tenue"
                        />
                        <span className="text-[11.5px] leading-none font-semibold text-encre-douce">
                          {piece.nom}
                        </span>
                        <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                          {piece.taille}
                        </span>
                      </span>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Répondre reste possible hors demande de complément, tant que le
            dossier n'est pas clos : c'est ainsi qu'on relance un service. */}
        {demande.etat !== "Close" && !demande.complementAttendu && (
          <div className="mt-4 flex flex-col gap-3 border-t border-separateur pt-4">
            <ChampTexteLong
              libelle="Écrire au service"
              placeholder="Votre message."
              rows={3}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
            />
            <ZoneDepot
              libelle="Joindre des pièces (facultatif)"
              fichiers={fichiers}
              onChange={setFichiers}
            />
            <div>
              <Bouton
                variante="principal"
                icone="exporter"
                chargement={repondre.isPending}
                disabled={!texte.trim() && fichiers.length === 0}
                onClick={envoyer}
              >
                {repondre.isPending ? "Envoi en cours…" : "Envoyer"}
              </Bouton>
            </div>
          </div>
        )}
      </Carte>

      <Carte titre="Pièces du dossier">
        <ul className="mt-3.5 flex flex-col">
          {demande.pieces.map((piece, index) => (
            <li
              key={piece.id}
              className={`flex items-center gap-3 py-3 ${
                index > 0 ? "border-t border-separateur" : ""
              }`}
            >
              <Icone
                nom="document"
                taille={16}
                className="flex-none text-encre-tenue"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[13px] leading-none font-semibold text-encre">
                  {piece.nom}
                </span>
                <span className="text-[11.5px] leading-none font-medium text-encre-tenue">
                  {piece.parVous
                    ? "Transmise par vous"
                    : "Transmise par le service"}{" "}
                  le {formaterDate(piece.deposeeLe)} · {piece.taille}
                </span>
              </span>
              <Bouton icone="exporter">Télécharger</Bouton>
            </li>
          ))}
        </ul>
      </Carte>
    </div>
  );
}
