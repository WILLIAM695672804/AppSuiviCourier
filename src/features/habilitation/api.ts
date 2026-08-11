import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Permission } from "@/types/habilitation";

/**
 * Domaine « habilitation ».
 *
 * Un profil est une liste de permissions, rien d'autre. Un perimetre dit sur
 * quelles donnees ces permissions s'exercent. La combinaison des deux remplace
 * ce qu'un autre logiciel appellerait un role — et c'est pour cela qu'aucun
 * nom de role n'existe dans le code.
 */
export interface Profil {
  id: number;
  libelle: string;
  nombreAgents: number;
  /** Un profil verrouille ne peut etre ni modifie ni supprime. */
  verrouille: boolean;
  permissions: Permission[];
}

export interface PerimetreAdmin {
  id: number;
  libelle: string;
  assise: string;
  etendue: string;
  nombreAgents: number;
  inclureDescendants: boolean;
  voirConfidentiel: boolean;
  lectureClotures: boolean;
  statistiquesAgregees: boolean;
}

export interface SessionCourrier {
  id: number;
  libelle: string;
  courriersEnCours: number;
  agents: { id: number; nomComplet: string; poste: string; rattacheLe: string }[];
}

export interface Delegation {
  id: number;
  titulaire: string;
  delegataire: string;
  poste: string;
  etendue: string;
  debut: string;
  fin: string;
  motif: string;
  etat: "active" | "programmee" | "close";
}

/**
 * Ce que la session peut déléguer, et à qui.
 *
 * Le serveur seul répond : il connaît le périmètre du titulaire et les postes
 * qui peuvent recevoir chacune de ses attributions. Le client n'énumère rien —
 * proposer ici un agent que le serveur refusera ensuite ne ferait que déplacer
 * le refus après la saisie.
 */
export interface DelegationPossible {
  delegataires: { id: number; nomComplet: string; poste: string }[];
  etendues: string[];
}

export interface SaisieDelegation {
  delegataireId: number;
  etendue: string;
  debut: string;
  fin: string;
  motif: string;
}

export const clesHabilitation = {
  racine: ["habilitation"] as const,
};

export interface Utilisateur {
  id: number;
  nomComplet: string;
  initiales: string;
  identifiant: string;
  structure: string;
  poste: string;
  profil: string;
  etat: "actif" | "suspendu" | "invite";
}

export const utilisateursQuery = (vue: string) =>
  queryOptions({
    queryKey: ["habilitation", "utilisateurs", vue],
    queryFn: ({ signal }) => api.get<Utilisateur[]>(`/habilitations/utilisateurs?vue=${vue}`, signal),
    placeholderData: (precedent) => precedent,
  });

export const profilsQuery = () =>
  queryOptions({
    queryKey: ["habilitation", "profils"],
    queryFn: ({ signal }) => api.get<Profil[]>("/habilitations/profils", signal),
  });

export const perimetresQuery = () =>
  queryOptions({
    queryKey: ["habilitation", "perimetres"],
    queryFn: ({ signal }) => api.get<PerimetreAdmin[]>("/habilitations/perimetres", signal),
  });

export const sessionsQuery = () =>
  queryOptions({
    queryKey: ["habilitation", "sessions"],
    queryFn: ({ signal }) => api.get<SessionCourrier[]>("/habilitations/sessions", signal),
  });

export const delegationsQuery = () =>
  queryOptions({
    queryKey: ["habilitation", "delegations"],
    queryFn: ({ signal }) => api.get<Delegation[]>("/habilitations/delegations", signal),
  });

/**
 * Les délégations de la session elle-même — celles qu'elle a posées.
 *
 * Distinct de `delegationsQuery`, qui montre l'ensemble à l'administrateur. Un
 * responsable pose et retire les siennes sans avoir à demander à quiconque
 * (§3.4) ; il n'a pas pour autant à voir celles des autres.
 */
export const mesDelegationsQuery = () =>
  queryOptions({
    queryKey: ["habilitation", "delegations", "miennes"],
    queryFn: ({ signal }) => api.get<Delegation[]>("/habilitations/delegations/miennes", signal),
  });

export const delegationPossibleQuery = () =>
  queryOptions({
    queryKey: ["habilitation", "delegations", "possible"],
    queryFn: ({ signal }) =>
      api.get<DelegationPossible>("/habilitations/delegations/possible", signal),
  });

export function useDeclarerDelegation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: SaisieDelegation) =>
      api.post<Delegation>("/habilitations/delegations", corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesHabilitation.racine });
    },
  });
}

/**
 * Interrompre une délégation avant son terme.
 *
 * Indispensable, et non un confort : une absence écourtée laisserait sinon un
 * agent signer au nom d'un autre revenu à son poste. La délégation n'est pas
 * effacée — elle est close, et reste au registre de l'administrateur.
 */
export function useInterrompreDelegation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/habilitations/delegations/${id}`),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesHabilitation.racine });
    },
  });
}

export function useBasculerPermission(profilId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { permission: Permission; accordee: boolean }) =>
      api.patch<void>(`/habilitations/profils/${profilId}/permissions`, corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesHabilitation.racine });
    },
  });
}
