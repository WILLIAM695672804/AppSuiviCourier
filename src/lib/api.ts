/**
 * Client HTTP unique de l'application.
 *
 * Regle d'architecture : aucun composant n'appelle `fetch` directement.
 * Tout passe par les fichiers `api.ts` de chaque domaine, qui appellent ce client.
 * C'est le seul endroit a modifier le jour ou l'authentification change.
 *
 * **Plus aucun repli sur le serveur de demonstration.** Le client a longtemps
 * detourne vers `src/lib/demo/serveur.ts` les chemins qu'aucun pilier ne
 * servait ; ce detour est retire (voir ADR 008). Toute requete part au
 * backend, et un domaine non livre repond 404 — visiblement, plutot que par
 * une donnee inventee qu'on finit par prendre pour vraie.
 */

import { ErreurApi } from "@/lib/erreurApi";

export { ErreurApi } from "@/lib/erreurApi";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Jeton CSRF pose par Django dans le cookie `suivi_csrf`.
 *
 * Depuis django-ninja 1.0 la protection CSRF est portee par la classe
 * d'authentification : `SessionAuth`, dont herite `ExigePermission`, l'active.
 * Sans cet en-tete, toute ecriture repartirait en 403 — et le message serait
 * incomprehensible pour l'utilisateur.
 */
function jetonCsrf(): string | null {
  const trouve = document.cookie.split("; ").find((morceau) => morceau.startsWith("suivi_csrf="));
  return trouve ? decodeURIComponent(trouve.slice("suivi_csrf=".length)) : null;
}

type Options = {
  methode?: "GET" | "POST" | "PATCH" | "DELETE";
  corps?: unknown;
  signal?: AbortSignal;
};

async function requete<T>(chemin: string, options: Options = {}): Promise<T> {
  const { methode = "GET", corps, signal } = options;

  const entetes: Record<string, string> = {};
  // `FormData` n'est pas du JSON, et surtout : il ne faut **pas** poser
  // `Content-Type` soi-meme. La frontiere multipart est un jeton aleatoire que
  // le navigateur genere au moment de l'envoi ; un en-tete ecrit a la main ne
  // la porte pas, et le serveur lit alors un corps qu'il ne sait pas decouper.
  const estFormulaire = corps instanceof FormData;
  if (corps && !estFormulaire) entetes["Content-Type"] = "application/json";
  if (methode !== "GET") {
    const jeton = jetonCsrf();
    if (jeton) entetes["X-CSRFToken"] = jeton;
  }

  const reponse = await fetch(`${BASE_URL}${chemin}`, {
    method: methode,
    // Le cookie de session est porte par le navigateur ; aucun jeton en localStorage.
    credentials: "include",
    headers: entetes,
    body: corps ? (estFormulaire ? (corps as FormData) : JSON.stringify(corps)) : undefined,
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
  // Le seul appel qui n'envoie pas de JSON. Encoder un binaire en base64 pour
  // le faire tenir dans un corps JSON ajouterait un tiers de poids, sur des
  // liaisons qui sont deja ce qu'elles sont dans les terminaux.
  televerser: <T>(chemin: string, formulaire: FormData) =>
    requete<T>(chemin, { methode: "POST", corps: formulaire }),
  patch: <T>(chemin: string, corps?: unknown) => requete<T>(chemin, { methode: "PATCH", corps }),
  delete: <T>(chemin: string) => requete<T>(chemin, { methode: "DELETE" }),
};
