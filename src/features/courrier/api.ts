import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NiveauFeu } from "@/lib/feu";
import type { CourrierDetail, CourrierResume, SensCourrier } from "@/types/courrier";

/**
 * Seul point de contact entre le domaine « courrier » et le serveur.
 * Aucun composant n'appelle `api` directement.
 */

/** Les six vues du registre. Ce sont des filtres, pas des etapes. */
export type VueRegistre = "tous" | "nonCotes" | "affectes" | "horsDelai" | "urgents" | "clotures";

export interface FiltresRegistre {
  sens?: SensCourrier;
  vue?: VueRegistre;
  recherche?: string;
  page?: number;
}

function versParametres(filtres: FiltresRegistre): string {
  const p = new URLSearchParams();
  if (filtres.sens) p.set("sens", filtres.sens);
  if (filtres.vue && filtres.vue !== "tous") p.set("vue", filtres.vue);
  if (filtres.recherche) p.set("q", filtres.recherche);
  if (filtres.page && filtres.page > 1) p.set("page", String(filtres.page));
  const chaine = p.toString();
  return chaine ? `?${chaine}` : "";
}

/**
 * L'adresse d'édition du registre.
 *
 * Un lien, et non un `fetch` suivi d'un `Blob` : le cookie de session part avec
 * la navigation, le navigateur nomme le fichier d'après l'en-tête que le
 * serveur pose, et la sortie passe par le serveur, qui l'inscrit au journal des
 * accès. Un document assemblé côté client n'aurait laissé aucune trace.
 *
 * Les paramètres sont **ceux du registre affiché** : on édite ce qu'on regarde.
 * `page` est écartée — un document se lit d'un bout à l'autre, il n'a pas de
 * page courante.
 */
export function adresseExportRegistre(filtres: FiltresRegistre, format: "pdf" | "docx"): string {
  const parametres = versParametres({ ...filtres, page: undefined });
  return `/api/courriers/export${parametres ? `${parametres}&` : "?"}format=${format}`;
}

/** L'adresse de la fiche de cotation — B-03, le bordereau qui suit le pli. */
export function adresseExportFicheCotation(id: number, format: "pdf" | "docx"): string {
  return `/api/courriers/${id}/fiche-cotation/export?format=${format}`;
}

export interface PageCourriers {
  lignes: CourrierResume[];
  /** Nombre de courriers retenus par le filtre courant. */
  total: number;
  /** Nombre de courriers du registre, tous filtres leves. */
  totalRegistre: number;
  page: number;
  taillePage: number;
}

export interface IndicateursRegistre {
  arrivesAujourdHui: { valeur: number; variation: string; serie: number[] };
  enAttenteCotation: { valeur: number; variation: string; serie: number[] };
  delaiMoyenCotation: { valeur: string; variation: string; serie: number[] };
  horsDelai: { valeur: number; variation: string; serie: number[] };
}

export const clesCourrier = {
  racine: ["courrier"] as const,
  registre: (filtres: FiltresRegistre) => ["courrier", "registre", filtres] as const,
  indicateurs: (sens: SensCourrier) => ["courrier", "indicateurs", sens] as const,
  fiche: (id: number) => ["courrier", "fiche", id] as const,
};

export const registreQuery = (filtres: FiltresRegistre) =>
  queryOptions({
    queryKey: clesCourrier.registre(filtres),
    queryFn: ({ signal }) => api.get<PageCourriers>(`/courriers${versParametres(filtres)}`, signal),
    // La liste reste affichee pendant le chargement du filtre suivant :
    // un tableau qui disparait a chaque clic d'onglet est illisible.
    placeholderData: (precedent) => precedent,
  });

export const indicateursQuery = (sens: SensCourrier) =>
  queryOptions({
    queryKey: clesCourrier.indicateurs(sens),
    queryFn: ({ signal }) =>
      api.get<IndicateursRegistre>(`/courriers/indicateurs?sens=${sens}`, signal),
    staleTime: 5 * 60 * 1000,
  });

export const ficheQuery = (id: number) =>
  queryOptions({
    queryKey: clesCourrier.fiche(id),
    queryFn: ({ signal }) => api.get<CourrierDetail>(`/courriers/${id}`, signal),
  });

/**
 * Ce que le serveur sait avant meme que l'agent saisisse : le numero qui sera
 * attribue et l'horodatage d'arrivee. Le client ne fabrique ni l'un ni l'autre.
 */
export interface ContexteEnregistrement {
  numeroPrevu: string;
  dateArrivee: string;
  sessionLibelle: string;
}

export const contexteEnregistrementQuery = () =>
  queryOptions({
    queryKey: ["courrier", "contexte-enregistrement"],
    queryFn: ({ signal }) => api.get<ContexteEnregistrement>("/courriers/contexte", signal),
    // Le numero doit etre repris a chaque ouverture de l'ecran.
    staleTime: 0,
    gcTime: 0,
  });

export function useEnregistrer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: unknown) => api.post<CourrierDetail>("/courriers", saisie),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
      client.invalidateQueries({ queryKey: ["compteurs"] });
    },
  });
}

/** Saisie d'une cotation. Le rang 1 des structures designe le chef de file. */
export interface SaisieCotation {
  mentionTypeId: number | null;
  annotation: string;
  delaiFixe: string | null;
  /**
   * Le delai imparti, en jours **ouvres**. Le serveur en tire la date : compter
   * les jours ouvres suppose le calendrier des feries, qui est en base.
   */
  delaiJours: number | null;
  /** L'autorite qui a decide — distincte de l'agent qui saisit. */
  decideParId: number;
  decideLe: string;
  /** Ordonnee : la premiere structure est le chef de file. */
  structureIds: number[];
}

/**
 * La cotation, un courrier a la fois.
 *
 * Le courrier est passe **a l'appel** et non a la construction du hook : le
 * registre cote une selection, et la meme decision se repete alors sur chaque
 * ligne. Une route de lot aurait masque un refus partiel — un courrier clos au
 * milieu de vingt — sous une reponse unique.
 */
export function useCoter() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ courrierId, saisie }: { courrierId: number; saisie: SaisieCotation }) =>
      api.post<CourrierDetail>(`/courriers/${courrierId}/cotations`, saisie),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

/**
 * Fiche de vie : le journal du courrier, redige pour etre lu.
 * `marge` est le temps ecoule depuis l'etape precedente — c'est lui qui
 * revele ou le courrier a attendu.
 */
export interface EtapeVie {
  id: number;
  heure: string;
  date: string;
  titre: string;
  detail: string;
  acteur: string;
  marge: string;
  /** Faux quand l'etape signale un incident : ecart, suspension, retard. */
  conforme: boolean;
  /** Etape qui engage l'institution, conservee par le filtre « Jalons ». */
  jalon: boolean;
}

export interface FicheVie {
  numero: string;
  objet: string;
  etapes: EtapeVie[];
  resume: { libelle: string; valeur: string; ton: "neutre" | "succes" | "alerte" }[];
  detenteurs: { nom: string; structure: string; initiales: string; duree: string }[];
  lies: { reference: string; titre: string; chemin: string }[];
}

export const ficheDeVieQuery = (id: number) =>
  queryOptions({
    queryKey: ["courrier", "vie", id],
    queryFn: ({ signal }) => api.get<FicheVie>(`/courriers/${id}/fiche-de-vie`, signal),
  });

/** Pli remis contre decharge : la preuve papier de la transmission. */
export interface AccusePhysique {
  id: number;
  reference: string;
  objet: string;
  destinataire: string;
  remise: string;
  coursier: string;
  recepteur: string;
  decharge: string;
  etat: string;
}

export const accusesQuery = (vue: string) =>
  queryOptions({
    queryKey: ["courrier", "accuses", vue],
    queryFn: ({ signal }) => api.get<AccusePhysique[]>(`/accuses?vue=${vue}`, signal),
  });

export interface Signalement {
  id: number;
  reference: string;
  type: string;
  detail: string;
  etat: string;
}

export const signalementsQuery = () =>
  queryOptions({
    queryKey: ["courrier", "signalements"],
    queryFn: ({ signal }) => api.get<Signalement[]>("/signalements", signal),
    staleTime: 5 * 60 * 1000,
  });

export function useSignalerEcart(courrierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: {
      type: string;
      description: string;
      gravite: string;
      destinataireStructureId: number;
    }) => api.post<void>(`/courriers/${courrierId}/signalements`, corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

export function useAffecter(courrierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { utilisateurId: number; consigne: string }) =>
      api.post<CourrierDetail>(`/courriers/${courrierId}/affectations`, corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

/**
 * Le report d'echeance.
 *
 * `delaiJours` compte en jours **ouvres**, et le serveur les ajoute a
 * l'echeance en vigueur — pas a aujourd'hui : prolonger de trois jours un
 * courrier en retard de huit ne doit pas effacer le retard.
 */
export interface SaisieProlongation {
  nouvelleEcheance?: string | null;
  delaiJours?: number | null;
  /** Obligatoire : un report sans raison ne se défend pas devant un contrôle. */
  motif: string;
}

export function useProlonger(courrierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: SaisieProlongation) =>
      api.post<CourrierDetail>(`/courriers/${courrierId}/prolongation`, saisie),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

/**
 * Une correction de saisie. **Les champs omis restent inchanges** : c'est un
 * `PATCH`, et un formulaire partiel ne doit pas effacer ce qu'il n'affiche pas.
 *
 * Le numero, le registre, le sens, la confidentialite et la date de reception
 * n'y figurent pas : ce sont les mentions du cahier, et les corriger apres coup
 * ote au registre sa valeur probante.
 */
export interface SaisieCorrection {
  objet?: string;
  correspondantId?: number;
  natureId?: number;
  referenceExpediteur?: string;
  dateLettre?: string;
  nombrePages?: number;
  urgent?: boolean;
  observations?: string;
  motif?: string;
}

export function useCorriger(courrierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: SaisieCorrection) =>
      api.patch<CourrierDetail>(`/courriers/${courrierId}`, saisie),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

/* ------------------------------------------------------------------ *
 *  File d'import — §3.6
 *
 *  Ni l'import par lot ni l'interception d'e-mails n'enregistrent
 *  directement : les pieces atterrissent dans une file ou l'agent qualifie
 *  avant de valider. Un import sans controle remplirait le registre de
 *  doublons et de messages sans objet.
 * ------------------------------------------------------------------ */

export type EtatImport = "À qualifier" | "Qualifié" | "Doublon" | "Écarté";

export interface MessageIntercepte {
  id: number;
  objet: string;
  expediteur: string;
  recuLe: string;
  pieces: number;
  /** Nature deduite par la reconnaissance, a confirmer par l'agent. */
  naturePresumee: string | null;
  /** Score de confiance de la deduction — RF-IA-02, affiche comme l'exige RF-IA-04. */
  confiance: number | null;
  etat: EtatImport;
  motif: string | null;
  traitePar: string | null;
}

export interface FileImport {
  boite: string;
  dernierReleve: string | null;
  messages: MessageIntercepte[];
  compteurs: { libelle: string; valeur: number | string; note: string; feu: NiveauFeu }[];
}

export const fileImportQuery = () =>
  queryOptions({
    queryKey: ["courrier", "import"],
    queryFn: ({ signal }) => api.get<FileImport>("/courriers/import", signal),
  });
