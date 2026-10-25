import { useState } from "react";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { formaterDateHeure } from "@/lib/format";
import type { CourrierDetail, Traitement } from "@/types/courrier";

/**
 * Ce que l'agent coté écrit du courrier, et ce que le responsable en fait.
 *
 * Un seul bloc pour les deux rôles, parce que c'est un seul objet : l'agent
 * rédige et restitue, le responsable lit, retourne ou clôture. Deux écrans
 * auraient séparé le texte de la décision qu'il appelle, et le responsable
 * aurait jugé de mémoire.
 *
 * Le trajet est celui que le Port a décrit le 26 août 2026 : l'agent traite,
 * restitue au responsable de structure, et le responsable clôture — sans visa
 * ni signature, il n'y en a pas sur le courrier arrivé (ADR 034).
 */
const TONS_STATUT = {
  brouillon: "neutre",
  soumis: "accent",
  retourne: "alerte",
  valide: "succes",
} as const;

export function BlocTraitement({
  courrier,
  peutRediger,
  peutClore,
  enCours,
  onEnregistrer,
  onRestituer,
  onRetourner,
  onCloturer,
}: {
  courrier: CourrierDetail;
  peutRediger: boolean;
  peutClore: boolean;
  enCours: boolean;
  onEnregistrer: (contenu: string) => void;
  onRestituer: (contenu: string) => void;
  onRetourner: (traitementId: number, motif: string) => void;
  onCloturer: (observation: string) => void;
}) {
  // La zone de saisie part de ce que le serveur a enregistré. Elle se
  // réinitialise par la `key` posée à l'appel du composant, et non par un
  // effet : le serveur fait foi après chaque écriture, et un `useEffect` qui
  // recopie une propriété dans un état est une cascade de rendus pour rien.
  const mien = courrier.monTraitement;
  const [contenu, setContenu] = useState(mien?.contenu ?? "");
  const [motifs, setMotifs] = useState<Record<number, string>>({});
  const [observation, setObservation] = useState("");

  const restitue = mien?.statut === "soumis";
  const autres = courrier.traitements.filter((t) => t.id !== mien?.id);

  return (
    <Carte
      titre="Traitement"
      aDroite={
        mien && <Etiquette ton={TONS_STATUT[mien.statut]}>{mien.statutLibelle}</Etiquette>
      }
    >
      {peutRediger && (
        <div className="mt-3.5 flex flex-col gap-2.5">
          {restitue ? (
            <Encart ton="accent" icone="coche">
              Vous avez restitué ce traitement le{" "}
              {mien?.restitueLe ? formaterDateHeure(mien.restitueLe) : "—"}. Il attend son
              responsable, qui le clôture ou vous le retourne. Tant qu'il ne l'a pas fait, le
              texte ne se modifie plus.
            </Encart>
          ) : (
            <>
              {mien?.statut === "retourne" && (
                <Encart ton="alerte" icone="aide">
                  Ce traitement vous a été retourné : reprenez-le, puis restituez-le à nouveau.
                  Le motif du retour est au fil des événements.
                </Encart>
              )}
              <textarea
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                rows={7}
                placeholder="Ce qui a été fait du courrier : les vérifications, les pièces produites, la suite donnée…"
                className="w-full resize-y rounded-none border border-bordure-forte px-3 py-2.5 text-xs leading-[1.6] font-medium text-encre outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
              />
              <div className="flex items-center gap-2">
                {/* Enregistrer sans restituer : le traitement d'un courrier
                    s'écrit rarement d'une traite, et rien ne doit obliger
                    l'agent à le rendre pour ne pas le perdre. */}
                <Bouton
                  variante="doux"
                  onClick={() => onEnregistrer(contenu.trim())}
                  disabled={enCours || !contenu.trim()}
                >
                  Enregistrer
                </Bouton>
                <Bouton
                  variante="principal"
                  icone="coche"
                  onClick={() => onRestituer(contenu.trim())}
                  disabled={enCours || !contenu.trim()}
                >
                  Restituer au responsable
                </Bouton>
              </div>
            </>
          )}
        </div>
      )}

      {!peutRediger && !mien && autres.length === 0 && (
        <p className="mt-3.5 text-[12.5px] font-medium text-encre-tenue">
          Aucun traitement n'a encore été écrit sur ce courrier.
        </p>
      )}

      {autres.length > 0 && (
        <div className="mt-3.5 flex flex-col gap-3">
          {autres.map((traitement) => (
            <LigneTraitement
              key={traitement.id}
              traitement={traitement}
              peutRetourner={peutClore && traitement.statut === "soumis"}
              motif={motifs[traitement.id] ?? ""}
              onMotif={(valeur) => setMotifs({ ...motifs, [traitement.id]: valeur })}
              onRetourner={() => onRetourner(traitement.id, (motifs[traitement.id] ?? "").trim())}
              enCours={enCours}
            />
          ))}
        </div>
      )}

      {peutClore && (
        <div className="mt-3.5 flex flex-col gap-2.5 border-t border-separateur pt-3.5">
          <p className="text-[11.5px] leading-[1.5] font-medium text-encre-faible">
            La clôture est <span className="font-bold text-encre">définitive</span> : il n'existe
            pas de réouverture, parce qu'un courrier rouvert aurait deux dates de fin et que le
            délai de traitement n'en mesurerait plus aucune.
          </p>
          <input
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Observation de clôture (facultative)"
            className="w-full rounded-none border border-bordure-forte px-3 py-2.5 text-xs leading-none font-medium text-encre outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
          />
          <Bouton
            variante="principal"
            icone="coche"
            onClick={() => onCloturer(observation.trim())}
            disabled={enCours}
          >
            Clôturer le courrier
          </Bouton>
        </div>
      )}
    </Carte>
  );
}

function LigneTraitement({
  traitement,
  peutRetourner,
  motif,
  onMotif,
  onRetourner,
  enCours,
}: {
  traitement: Traitement;
  peutRetourner: boolean;
  motif: string;
  onMotif: (valeur: string) => void;
  onRetourner: () => void;
  enCours: boolean;
}) {
  return (
    <article className="flex flex-col gap-2 rounded-none border border-bordure px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs leading-none font-bold text-encre">{traitement.redacteur}</span>
        <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
          {traitement.structure} · version {traitement.version} ·{" "}
          {formaterDateHeure(traitement.restitueLe ?? traitement.modifieLe)}
        </span>
        <Etiquette ton={TONS_STATUT[traitement.statut]}>{traitement.statutLibelle}</Etiquette>
      </div>
      <p className="text-xs leading-[1.6] font-medium whitespace-pre-line text-pretty text-encre-moyenne">
        {traitement.contenu}
      </p>

      {peutRetourner && (
        <div className="flex items-center gap-2 border-t border-separateur pt-2.5">
          {/* Le motif est obligatoire côté serveur, et dix caractères au moins :
              un retour sans un mot ne se distingue pas d'un oubli, et l'agent
              qui le reçoit n'a rien à reprendre. */}
          <input
            value={motif}
            onChange={(e) => onMotif(e.target.value)}
            placeholder="Ce qui manque, pour que l'agent sache quoi reprendre…"
            className="min-w-0 flex-1 rounded-none border border-bordure-forte px-3 py-2 text-[11.5px] leading-none font-medium text-encre outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
          />
          <Bouton variante="doux" onClick={onRetourner} disabled={enCours || motif.trim().length < 10}>
            Retourner
          </Bouton>
        </div>
      )}
    </article>
  );
}
