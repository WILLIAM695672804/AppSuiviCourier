import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CourrierResume, DelaiCourrier } from "@/types/courrier";
import type { DossierTraitement, PortefeuilleAgent } from "@/types/suivi";

/** Criteres de la recherche avancee, tels que l'agent les saisit. */
export interface CriteresRecherche {
  motsCles: string;
  du: string;
  au: string;
  sessions: string[];
  statuts: string[];
  structureId: string;
  natureId: string;
  inclureArchives: boolean;
}

export interface RechercheEnregistree {
  id: number;
  libelle: string;
  nombre: number;
  criteres: CriteresRecherche;
}

/** Seul point de contact entre le domaine « suivi » et le serveur. */
export const clesSuivi = {
  racine: ["suivi"] as const,
  portefeuille: () => ["suivi", "portefeuille"] as const,
  dossier: (id: number) => ["suivi", "dossier", id] as const,
};

export const portefeuilleQuery = () =>
  queryOptions({
    queryKey: clesSuivi.portefeuille(),
    queryFn: ({ signal }) => api.get<PortefeuilleAgent>("/suivi/portefeuille", signal),
  });

export const dossierQuery = (id: number) =>
  queryOptions({
    queryKey: clesSuivi.dossier(id),
    queryFn: ({ signal }) => api.get<DossierTraitement>(`/suivi/dossiers/${id}`, signal),
  });

/** Les cinq vues du suivi des delais. */
export type VueRelance = "horsDelai" | "sous48h" | "sansAccuse" | "dejaRelances" | "tous";

export interface LigneRelance {
  id: number;
  numero: string;
  objet: string;
  structure: string;
  agent: string | null;
  delai: DelaiCourrier | null;
  derniereRelance: string | null;
  /** 0 : aucune escalade. 1, 2, 3 : niveaux hierarchiques saisis. */
  niveauEscalade: number;
}

export interface TableauRelance {
  lignes: LigneRelance[];
  indicateurs: {
    horsDelai: number;
    horsDelaiGrave: number;
    sous48h: number;
    structuresConcernees: number;
    relancesMois: number;
    escalades: number;
    tauxRespect: number;
  };
}

export const relanceQuery = (vue: VueRelance) =>
  queryOptions({
    queryKey: ["suivi", "relance", vue],
    queryFn: ({ signal }) => api.get<TableauRelance>(`/suivi/relance?vue=${vue}`, signal),
    placeholderData: (precedent) => precedent,
  });

export const recherchesEnregistreesQuery = () =>
  queryOptions({
    queryKey: ["suivi", "recherches"],
    queryFn: ({ signal }) => api.get<RechercheEnregistree[]>("/suivi/recherches", signal),
    staleTime: 10 * 60 * 1000,
  });

/**
 * Recherche avancee.
 * `criteres` a null tant que l'agent n'a pas lance la recherche : on
 * n'interroge pas le serveur a chaque frappe dans un formulaire a dix champs.
 */
export const rechercheQuery = (criteres: CriteresRecherche | null) =>
  queryOptions({
    queryKey: ["suivi", "recherche", criteres],
    queryFn: ({ signal }) =>
      api.post<{ lignes: CourrierResume[]; total: number }>("/suivi/recherche", criteres, signal),
    enabled: criteres !== null,
  });

export function useBasculerTache(dossierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ tacheId, faite }: { tacheId: number; faite: boolean }) =>
      api.patch<void>(`/suivi/dossiers/${dossierId}/taches/${tacheId}`, { faite }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesSuivi.dossier(dossierId) });
    },
  });
}

export function useAjouterNote(dossierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { texte: string; privee: boolean }) =>
      api.post<void>(`/suivi/dossiers/${dossierId}/notes`, corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesSuivi.dossier(dossierId) });
    },
  });
}

export function useDemanderDelai(dossierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { joursDemandes: number; motif: string }) =>
      api.post<void>(`/suivi/dossiers/${dossierId}/demandes-delai`, corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesSuivi.racine });
    },
  });
}
