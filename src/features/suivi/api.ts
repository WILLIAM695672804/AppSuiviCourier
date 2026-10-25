import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
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
    queryFn: ({ signal }) =>
      api.get<PortefeuilleAgent>("/suivi/portefeuille", signal),
  });

export const dossierQuery = (id: number) =>
  queryOptions({
    queryKey: clesSuivi.dossier(id),
    queryFn: ({ signal }) =>
      api.get<DossierTraitement>(`/suivi/dossiers/${id}`, signal),
  });

/** Les cinq vues du suivi des delais. */
export type VueRelance =
  "horsDelai" | "sous48h" | "sansAccuse" | "dejaRelances" | "tous";

export interface LigneRelance {
  id: number;
  numero: string;
  objet: string;
  structure: string;
  /**
   * **Le directeur à qui la relance s'adresse** — celui de la tête de la
   * structure chef de file, jamais l'agent nommé. « — » quand aucun poste de
   * tête n'est pourvu au-dessus d'elle.
   */
  interlocuteur: string;
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
    queryFn: ({ signal }) =>
      api.get<TableauRelance>(`/suivi/relance?vue=${vue}`, signal),
    placeholderData: (precedent) => precedent,
  });

export const recherchesEnregistreesQuery = () =>
  queryOptions({
    queryKey: ["suivi", "recherches"],
    queryFn: ({ signal }) =>
      api.get<RechercheEnregistree[]>("/suivi/recherches", signal),
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
      api.post<{ lignes: CourrierResume[]; total: number }>(
        "/suivi/recherche",
        criteres,
        signal,
      ),
    enabled: criteres !== null,
  });

export function useBasculerTache(dossierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ tacheId, faite }: { tacheId: number; faite: boolean }) =>
      api.patch<void>(`/suivi/dossiers/${dossierId}/taches/${tacheId}`, {
        faite,
      }),
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

/**
 * Ajoute une etape a la liste de l'agent.
 *
 * La liste n'appartient qu'a lui : deux agents affectes au meme dossier en
 * tiennent deux, et ce n'est pas le circuit du courrier.
 */
export function useAjouterTache(dossierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { libelle: string }) =>
      api.post<void>(`/suivi/dossiers/${dossierId}/taches`, corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesSuivi.dossier(dossierId) });
    },
  });
}

/**
 * Conserve les criteres courants sous un nom.
 *
 * Le meme nom ecrase : l'agent qui affine sa recherche et la resauvegarde veut
 * la remplacer, pas lire un message d'erreur.
 */
export function useEnregistrerRecherche() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { libelle: string; criteres: CriteresRecherche }) =>
      api.post<RechercheEnregistree>("/suivi/recherches", corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["suivi", "recherches"] });
    },
  });
}

export function useOublierRecherche() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/suivi/recherches/${id}`),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["suivi", "recherches"] });
    },
  });
}

/**
 * Le responsable tranche une demande de report.
 *
 * Accorder prolonge reellement l'echeance du courrier : on invalide donc tout
 * le suivi **et** le registre, dont les jauges de delai changent.
 */
export function useDeciderDelai() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      demandeId,
      ...corps
    }: {
      demandeId: number;
      accordee: boolean;
      reponse: string;
    }) => api.post<void>(`/suivi/demandes-delai/${demandeId}`, corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesSuivi.racine });
      client.invalidateQueries({ queryKey: ["courriers"] });
    },
  });
}

export interface BilanRelance {
  emises: number;
  destinataires: string[];
  /** Un lot est partiel par nature : ces lignes disent pourquoi. */
  ecartes: string[];
}

/**
 * Relance les detenteurs d'un lot de dossiers.
 *
 * On invalide tout le suivi : la relance fait avancer « Dernière relance », le
 * niveau d'escalade, l'onglet « Déjà relancés » et deux des quatre cartes du
 * bandeau. Ne rafraichir que la vue courante aurait laissé les compteurs mentir
 * jusqu'au prochain changement d'onglet.
 */
export function useRelancer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { identifiants: number[]; motif: string }) =>
      api.post<BilanRelance>("/suivi/relances", corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesSuivi.racine });
    },
  });
}
