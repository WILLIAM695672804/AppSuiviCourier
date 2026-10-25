import { useState } from "react";
import { Etiqueteur } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { ModaleFormulaire } from "@/components/ui/ModaleFormulaire";
import { useRelancer, type BilanRelance } from "@/features/suivi/api";
import { ErreurApi } from "@/lib/api";

/**
 * C-02 — relancer un lot de dossiers.
 *
 * **On ne relance pas un courrier, on relance quelqu'un.** Le serveur cherche
 * l'agent affecté, puis à défaut le responsable de la structure cotée — et
 * écarte la ligne quand il ne trouve ni l'un ni l'autre, ce qui est le cas le
 * plus fréquent : un dossier que personne n'a pris.
 *
 * D'où le bilan affiché après coup plutôt qu'une simple fermeture. Un lot est
 * partiel par nature : sur quatorze retards du lundi matin, deux partiront sans
 * destinataire, et l'agent doit voir lesquelles pour savoir qu'il lui reste
 * quelque chose à faire.
 */
export function ModaleRelance({
  identifiants,
  ouverte,
  onFermer,
}: {
  identifiants: number[];
  ouverte: boolean;
  /** `true` quand des relances sont réellement parties : l'écran vide alors sa
   *  sélection. Annuler ne la vide pas — l'agent a mis du temps à la faire. */
  onFermer: (relancees: boolean) => void;
}) {
  const relancer = useRelancer();

  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [bilan, setBilan] = useState<BilanRelance | null>(null);

  function fermer() {
    const relancees = (bilan?.emises ?? 0) > 0;
    setBilan(null);
    setMotif("");
    setErreur(null);
    onFermer(relancees);
  }

  async function envoyer() {
    if (bilan) return fermer();
    setErreur(null);
    try {
      setBilan(await relancer.mutateAsync({ identifiants, motif }));
    } catch (e) {
      // Le serveur refuse le lot entier quand aucune ligne ne pouvait partir :
      // tout est clos, hors périmètre, ou sans détenteur.
      setErreur(
        e instanceof ErreurApi ? e.message : "La relance n'a pas abouti.",
      );
    }
  }

  return (
    <ModaleFormulaire
      ouverte={ouverte}
      onFermer={fermer}
      onEnvoyer={envoyer}
      titre={bilan ? "Relances envoyées" : "Relancer les dossiers sélectionnés"}
      sousTitre={
        bilan
          ? undefined
          : `${identifiants.length} dossier${identifiants.length > 1 ? "s" : ""} sélectionné${
              identifiants.length > 1 ? "s" : ""
            }`
      }
      libelleEnvoi={bilan ? "Fermer" : "Envoyer les relances"}
      consequence={
        bilan
          ? undefined
          : "Chaque destinataire reçoit une notification et le journal la garde."
      }
      enCours={relancer.isPending}
      erreur={erreur}
    >
      {bilan ? (
        <div className="flex flex-col gap-[17px]">
          <Encart ton="succes" icone="coche">
            {bilan.emises} relance{bilan.emises > 1 ? "s" : ""} envoyée
            {bilan.emises > 1 ? "s" : ""} à {bilan.destinataires.join(", ")}.
          </Encart>

          {/* Les écarts ne sont pas une erreur : ce sont les lignes qui
              demandent un autre geste que la relance. */}
          {bilan.ecartes.length > 0 && (
            <Encart ton="alerte" icone="aide">
              <span className="flex flex-col gap-1.5">
                {bilan.ecartes.map((ecart) => (
                  <span key={ecart}>{ecart}</span>
                ))}
              </span>
            </Encart>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-[17px]">
          <Etiqueteur
            libelle="Motif de la relance"
            aide="Facultatif. Le même mot part à tous les destinataires du lot."
          >
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              placeholder="Échéance dépassée. Merci de conclure ce dossier avant vendredi ou de motiver une demande de report."
              className="min-h-[70px] w-full resize-y rounded-none border border-bordure-forte px-3 py-3 text-xs leading-[1.6] font-medium text-encre-moyenne outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
            />
          </Etiqueteur>

          <Encart ton="neutre" icone="aide">
            La relance part à l'agent qui détient le dossier, ou au responsable
            de la structure cotée quand personne ne l'a pris. Un dossier sans
            détenteur ni responsable connu est écarté : il demande une
            affectation, pas une relance.
          </Encart>
        </div>
      )}
    </ModaleFormulaire>
  );
}
