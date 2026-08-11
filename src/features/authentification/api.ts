import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CLE_DECONNEXION, CLE_SESSION } from "@/lib/contexteSession";
import type { UtilisateurConnecte } from "@/types/habilitation";

/**
 * Ouverture et fermeture de session.
 *
 * Le serveur pose et retire un cookie ; le client ne conserve aucun jeton.
 * C'est ce qui permet de changer de mode d'authentification — annuaire de
 * l'institution ou comptes applicatifs — sans toucher a un seul ecran.
 */
export function useConnexion() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (identifiants: { identifiant: string; motDePasse: string }) =>
      api.post<UtilisateurConnecte>("/connexion", identifiants),
    onSuccess: (utilisateur) => {
      // La session est connue : on la pose directement, sans second aller-retour.
      client.setQueryData(CLE_SESSION, utilisateur);
      /*
       * La deconnexion precedente est soldee. Si la session tombe plus tard —
       * expiration, cookie retire par le serveur — le garde retiendra de
       * nouveau la destination, ce qui est le comportement voulu : l'agent
       * interrompu en plein travail doit revenir ou il en etait.
       */
      client.setQueryData(CLE_DECONNEXION, false);
    },
  });
}

export function useDeconnexion() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<void>("/deconnexion"),
    onSettled: () => {
      /*
       * Fermer la session dans le cache, et non le vider entierement.
       *
       * `queryClient.clear()` detache les observateurs deja montes : le
       * fournisseur de session continuait d'exposer l'utilisateur precedent,
       * l'ecran restait affiche, et l'ecran de connexion — croyant la session
       * ouverte — renvoyait aussitot vers l'accueil. Poser `null` notifie le
       * fournisseur, et c'est cela qui fait reellement sortir.
       */
      client.setQueryData<UtilisateurConnecte | null>(CLE_SESSION, null);

      /*
       * Dire au garde que ce depart est volontaire.
       *
       * Sans ce marqueur, il redirigeait vers l'ecran de connexion en retenant
       * la page quittee — et comme sa redirection part d'un effet, elle
       * arrivait apres celle du menu de profil et l'ecrasait. L'agent suivant
       * se connectait et atterrissait sur l'ecran du precedent au lieu de son
       * propre tableau de bord.
       */
      client.setQueryData(CLE_DECONNEXION, true);

      /*
       * Puis purger le reste, session exceptee.
       *
       * Sans cela, les registres et les fiches du compte precedent resteraient
       * en memoire : le compte suivant les verrait s'afficher une fraction de
       * seconde avant d'etre remplaces — y compris des courriers hors de son
       * perimetre. Sur un poste partage, c'est inacceptable.
       */
      client.removeQueries({
        predicate: (requete) => requete.queryKey[0] !== CLE_SESSION[0],
      });
    },
  });
}
