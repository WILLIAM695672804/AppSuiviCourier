import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CLE_SESSION, ContexteSession } from "@/lib/contexteSession";
import type { UtilisateurConnecte } from "@/types/habilitation";

/**
 * Ouvre la session et la met a disposition de toute l'application.
 *
 * Le serveur est seul juge : il renvoie la liste des permissions deja resolue
 * (profils, perimetre, delegations en cours). Le client ne fait que lire.
 * Masquer un bouton ici n'est jamais une securite — le serveur revalide toujours.
 *
 * L'absence de session n'est pas une erreur : c'est l'etat normal avant
 * connexion. C'est le garde `ExigeSession` qui redirige, pas ce fournisseur.
 */
export function FournisseurSession({ children }: { children: React.ReactNode }) {
  // `null` est une valeur legitime du cache : c'est ce que la deconnexion y
  // pose pour signifier qu'aucune session n'est ouverte.
  const { data, isPending } = useQuery<UtilisateurConnecte | null>({
    queryKey: CLE_SESSION,
    queryFn: () => api.get<UtilisateurConnecte>("/moi"),
    // La session change rarement pendant une journee de travail.
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return (
    <ContexteSession value={{ utilisateur: data ?? null, enCours: isPending }}>
      {children}
    </ContexteSession>
  );
}
