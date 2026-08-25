import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router";
import { PageChargement } from "@/components/ui/EtatChargement";
import { CLE_DECONNEXION, useSessionOptionnelle } from "@/lib/contexteSession";

/**
 * Porte d'entree de l'application.
 *
 * Sans session, on renvoie vers l'ecran de connexion en retenant la
 * destination : l'agent qui ouvre un lien vers un courrier precis y arrivera
 * apres s'etre identifie, au lieu d'atterrir sur l'accueil et de chercher.
 *
 * Sauf apres une deconnexion volontaire — la ce serait l'inverse du service
 * rendu : le poste suivant reprendrait l'ecran du precedent. C'est la
 * deconnexion qui le signale, elle seule connait cette intention.
 *
 * Comme `ExigePermission`, ce garde soigne le parcours ; il ne protege pas la
 * donnee. Le serveur refuse de lui-meme toute requete sans session valide.
 */
export function ExigeSession() {
  const { utilisateur, enCours } = useSessionOptionnelle();
  const emplacement = useLocation();

  // Marqueur pose par la deconnexion, jamais recupere du serveur : la requete
  // n'existe que pour rendre sa valeur reactive dans le cache.
  const { data: departVolontaire } = useQuery({
    queryKey: CLE_DECONNEXION,
    queryFn: () => false,
    enabled: false,
    initialData: false,
  });

  // Tant que le serveur n'a pas repondu, on n'affiche rien : rediriger ici
  // ferait clignoter l'ecran de connexion a chaque rechargement de page.
  if (enCours) {
    return <PageChargement message="Ouverture de la session…" />;
  }

  if (!utilisateur) {
    const destination = departVolontaire
      ? null
      : { depuis: emplacement.pathname + emplacement.search };

    return <Navigate to="/connexion" replace state={destination} />;
  }

  return <Outlet />;
}
