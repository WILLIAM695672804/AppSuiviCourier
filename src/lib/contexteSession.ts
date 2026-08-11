import { createContext, use } from "react";
import type { Permission, UtilisateurConnecte } from "@/types/habilitation";

/**
 * Contexte et lecteurs de la session.
 * Separe du fournisseur pour que celui-ci n'exporte qu'un composant
 * (exigence du rechargement a chaud de Vite).
 */
export interface EtatSession {
  utilisateur: UtilisateurConnecte | null;
  /** Vrai tant que le serveur n'a pas repondu : on ne redirige pas encore. */
  enCours: boolean;
}

export const ContexteSession = createContext<EtatSession | null>(null);

/** Clef unique de la session : la deconnexion l'invalide, la connexion la remplit. */
export const CLE_SESSION = ["session", "moi"] as const;

/**
 * Vrai lorsque la session a ete fermee volontairement.
 *
 * Une session absente peut l'etre pour deux raisons opposees, et le garde doit
 * les distinguer : ouvrir un lien profond sans etre identifie merite qu'on
 * retienne la destination ; se deconnecter du menu de profil, non — l'agent
 * suivant serait renvoye sur la page du precedent.
 *
 * Le marqueur est pose par la deconnexion, qui est seule a connaitre cette
 * intention, et efface par la connexion. Il partage le prefixe « session »
 * pour survivre a la purge du cache, qui epargne ce seul domaine.
 */
export const CLE_DECONNEXION = ["session", "fermee-volontairement"] as const;

/**
 * Etat brut de la session, utilisateur compris quand il est absent.
 * Reserve au garde de route : un ecran qui s'affiche a toujours une session.
 */
export function useSessionOptionnelle(): EtatSession {
  const etat = use(ContexteSession);
  if (!etat) {
    throw new Error("useSessionOptionnelle doit etre appele a l'interieur de <FournisseurSession>.");
  }
  return etat;
}

/**
 * L'utilisateur connecte.
 *
 * Leve si aucune session n'est ouverte — et c'est voulu : tous les ecrans sont
 * derriere le garde `ExigeSession`, donc l'utilisateur y est toujours present.
 * Le composant n'a pas a traiter un cas qui ne peut pas se produire.
 */
export function useSession(): UtilisateurConnecte {
  const { utilisateur } = useSessionOptionnelle();
  if (!utilisateur) {
    throw new Error("useSession a ete appele hors d'une session ouverte.");
  }
  return utilisateur;
}

/** Verifie une permission. Accepte plusieurs codes : au moins un suffit. */
export function usePermission(...codes: Permission[]): boolean {
  const { permissions } = useSession();
  return codes.some((code) => permissions.includes(code));
}
