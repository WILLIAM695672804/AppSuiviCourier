import type { ReactNode } from "react";
import { Bouton } from "@/components/ui/Bouton";
import { Encart } from "@/components/ui/Encart";
import { Modale } from "@/components/ui/Modale";

/**
 * Enveloppe commune des modales de saisie.
 *
 * Treize modales partagent exactement la même mécanique : un formulaire, un
 * bouton d'envoi qui se désactive pendant l'appel, une erreur serveur affichée
 * en tête plutôt qu'à côté du champ fautif, et une fermeture qui ne doit pas
 * survenir tant que l'envoi court. L'écrire une fois évite treize variantes
 * dont douze finiraient par diverger.
 *
 * L'erreur serveur est en tête et non en pied : sur téléphone, le pied d'une
 * modale est sous le pli, et un message d'échec qu'il faut aller chercher
 * passe pour une absence de réaction.
 *
 * `onFermer` est ignoré pendant l'envoi. Fermer une modale au milieu d'un
 * POST laisse l'utilisateur sans savoir si son action est passée.
 */
export function ModaleFormulaire({
  ouverte,
  onFermer,
  onEnvoyer,
  titre,
  sousTitre,
  /** Libellé du bouton principal. « Enregistrer » par défaut. */
  libelleEnvoi = "Enregistrer",
  /** Rappel de ce que l'envoi va produire, en pied de modale. */
  consequence,
  enCours = false,
  erreur,
  largeur,
  children,
}: {
  ouverte: boolean;
  onFermer: () => void;
  onEnvoyer: () => void;
  titre: string;
  sousTitre?: string;
  libelleEnvoi?: string;
  consequence?: ReactNode;
  enCours?: boolean;
  erreur?: string | null;
  largeur?: number;
  children: ReactNode;
}) {
  return (
    <Modale
      ouverte={ouverte}
      onFermer={() => {
        if (!enCours) onFermer();
      }}
      titre={titre}
      sousTitre={sousTitre}
      largeur={largeur}
      piedGauche={consequence}
      actions={
        <>
          <Bouton type="button" onClick={onFermer} disabled={enCours}>
            Annuler
          </Bouton>
          <Bouton
            type="submit"
            form="formulaire-modale"
            variante="principal"
            chargement={enCours}
          >
            {enCours ? "Envoi en cours…" : libelleEnvoi}
          </Bouton>
        </>
      }
    >
      <form
        id="formulaire-modale"
        onSubmit={(e) => {
          e.preventDefault();
          onEnvoyer();
        }}
        className="flex flex-col gap-4"
      >
        {erreur && (
          <Encart ton="danger" icone="croix">
            {erreur}
          </Encart>
        )}
        {children}
      </form>
    </Modale>
  );
}
