/**
 * Client HTTP unique de l'application.
 *
 * Regle d'architecture : aucun composant n'appelle `fetch` directement.
 * Tout passe par les fichiers `api.ts` de chaque domaine, qui appellent ce client.
 * C'est le seul endroit a modifier le jour ou l'authentification change.
 */

import { repondreEnDemo } from "@/lib/demo/serveur";
import { ErreurApi } from "@/lib/erreurApi";

export { ErreurApi } from "@/lib/erreurApi";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

/** Tant que le backend n'existe pas, les reponses sont simulees. */
const MODE_DEMO = import.meta.env.VITE_MODE_DEMO === "true";

type Options = {
  methode?: "GET" | "POST" | "PATCH" | "DELETE";
  corps?: unknown;
  signal?: AbortSignal;
};

async function requete<T>(chemin: string, options: Options = {}): Promise<T> {
  const { methode = "GET", corps, signal } = options;

  if (MODE_DEMO) {
    const simulee = repondreEnDemo(chemin, methode, corps);
    if (simulee) return (await simulee) as T;
  }

  const reponse = await fetch(`${BASE_URL}${chemin}`, {
    method: methode,
    // Le cookie de session est porte par le navigateur ; aucun jeton en localStorage.
    credentials: "include",
    headers: corps ? { "Content-Type": "application/json" } : undefined,
    body: corps ? JSON.stringify(corps) : undefined,
    signal,
  });

  if (reponse.status === 204) return undefined as T;

  const donnees = await reponse.json().catch(() => null);

  if (!reponse.ok) {
    const message =
      (donnees as { message?: string } | null)?.message ??
      "Le serveur n'a pas pu traiter la demande.";
    throw new ErreurApi(reponse.status, message, donnees);
  }

  return donnees as T;
}

export const api = {
  get: <T>(chemin: string, signal?: AbortSignal) => requete<T>(chemin, { signal }),
  // Le signal sert aux POST de lecture — une recherche relancee doit annuler
  // la precedente, sans quoi le resultat le plus lent gagne.
  post: <T>(chemin: string, corps?: unknown, signal?: AbortSignal) =>
    requete<T>(chemin, { methode: "POST", corps, signal }),
  patch: <T>(chemin: string, corps?: unknown) => requete<T>(chemin, { methode: "PATCH", corps }),
  delete: <T>(chemin: string) => requete<T>(chemin, { methode: "DELETE" }),
};
