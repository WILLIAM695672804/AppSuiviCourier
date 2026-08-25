import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bouton } from "@/components/ui/Bouton";
import { Etiqueteur, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Modale } from "@/components/ui/Modale";
import { useAffecter } from "@/features/courrier/api";
import { ErreurApi } from "@/lib/api";
import { agentsQuery } from "@/lib/referentiel";
import type { CourrierDetail } from "@/types/courrier";

/**
 * A-05 — affectation d'un courrier a un agent.
 *
 * **La cotation vise une structure, l'affectation vise une personne.** C'est la
 * regle que cette fenetre rend visible, et c'est aussi la contrainte du
 * serveur : `services.affecter` refuse un agent dont la structure n'est pas
 * cotee, parce qu'affecter hors cotation contournerait la decision de
 * l'autorite. L'ecran ne propose donc que les agents des structures cotees —
 * proposer les autres aurait fait choisir un nom pour recevoir un refus.
 *
 * Le filtre est pose sur l'annuaire complet plutot que par une requete par
 * structure : l'annuaire est mis en cache une heure et deja charge par
 * plusieurs ecrans, la ou une requete par structure cotee en aurait fait
 * jusqu'a cinq a chaque ouverture.
 *
 * Le serveur reste seul juge : ce filtre est un confort de saisie, pas une
 * garde.
 */
export function ModaleAffectation({
  courrier,
  ouverte,
  onFermer,
}: {
  courrier: CourrierDetail;
  ouverte: boolean;
  onFermer: () => void;
}) {
  const { data: agents = [] } = useQuery(agentsQuery());
  const affecter = useAffecter(courrier.id);

  const [utilisateurId, setUtilisateurId] = useState("");
  const [consigne, setConsigne] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  // Les structures cotees, dans l'ordre : la premiere cotation porte le chef de
  // file, et c'est de son equipe que sort le plus souvent l'agent designe.
  const cotees = courrier.cotations.flatMap((cotation) => cotation.structures);
  const identifiantsCotes = new Set(cotees.map((structure) => structure.structureId));
  const candidats = agents.filter(
    (agent) => agent.structureId !== null && identifiantsCotes.has(agent.structureId),
  );

  const choisi = candidats.find((agent) => String(agent.id) === utilisateurId);
  const valide = Boolean(choisi) && !affecter.isPending;

  async function valider() {
    if (!choisi) return;
    setErreur(null);
    try {
      await affecter.mutateAsync({ utilisateurId: choisi.id, consigne });
      onFermer();
      setUtilisateurId("");
      setConsigne("");
    } catch (e) {
      // Le message vient du serveur : c'est lui qui sait que l'agent est deja
      // affecte, que sa structure n'est pas cotee ou que le courrier est clos.
      // Trois refus differents, trois gestes differents pour l'agent.
      setErreur(e instanceof ErreurApi ? e.message : "L'affectation n'a pas abouti.");
    }
  }

  return (
    <Modale
      ouverte={ouverte}
      onFermer={onFermer}
      titre="Affecter le courrier"
      sousTitre={`${courrier.numero} · ${courrier.objet}`}
      piedGauche={
        choisi
          ? `${choisi.nomComplet} — ${choisi.structure}`
          : "Désignez l'agent chargé du traitement."
      }
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" onClick={valider} disabled={!valide}>
            {affecter.isPending ? "Affectation…" : "Affecter"}
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-[17px]">
        {cotees.length === 0 ? (
          <Encart ton="alerte" icone="aide">
            Ce courrier n'est pas encore coté. L'affectation pend à la cotation : il faut coter une
            structure avant de désigner un agent.
          </Encart>
        ) : (
          <>
            <div className="flex flex-col gap-[9px]">
              <span className="text-[11px] leading-none font-semibold text-encre-faible">
                Structures cotées
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {cotees.map((structure) => (
                  <Etiquette
                    key={`${structure.structureId}-${structure.rang}`}
                    ton={structure.chefDeFile ? "accent" : "neutre"}
                  >
                    {structure.libelle}
                    {structure.chefDeFile ? " — chef de file" : ""}
                  </Etiquette>
                ))}
              </div>
            </div>

            <Liste
              libelle="Agent chargé du traitement"
              invite="Désigner un agent…"
              options={candidats.map((agent) => ({
                valeur: String(agent.id),
                libelle: [agent.nomComplet, agent.poste, agent.structure]
                  .filter(Boolean)
                  .join(" — "),
              }))}
              value={utilisateurId}
              onChange={(e) => setUtilisateurId(e.target.value)}
              aide="Seuls les agents des structures cotées peuvent être désignés."
            />

            {candidats.length === 0 && (
              <Encart ton="alerte" icone="aide">
                Aucun agent n'est rattaché aux structures cotées. Il faut d'abord affecter un agent
                à un poste de l'une d'elles, dans l'administration de l'organisation.
              </Encart>
            )}

            <Etiqueteur libelle="Consigne portée à l'affectation">
              <textarea
                value={consigne}
                onChange={(e) => setConsigne(e.target.value)}
                rows={3}
                placeholder="Préparer un projet de réponse pour le 25, avec les pièces justificatives."
                className="min-h-[70px] w-full resize-y rounded-none border border-bordure-forte px-3 py-3 text-xs leading-[1.6] font-medium text-encre-moyenne outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
              />
            </Etiqueteur>
          </>
        )}

        {erreur && (
          <Encart ton="danger" icone="aide">
            {erreur}
          </Encart>
        )}
      </div>
    </Modale>
  );
}
