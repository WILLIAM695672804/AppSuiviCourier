import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CourrierDetail,
  CourrierResume,
  SensCourrier,
  Signalement,
} from "@/types/courrier";

/**
 * Seul point de contact entre le domaine « courrier » et le serveur.
 * Aucun composant n'appelle `api` directement.
 */

/**
 * Les sept vues du registre. Ce sont des filtres, pas des etapes.
 *
 * `affectes` et `aAffecter` ne sont pas symetriques et ne portent pas sur le
 * meme geste : `affectes` liste ce qui m'est affecte **a moi, personne**,
 * `aAffecter` ce qui est cote **a ma structure** et que personne n'a encore
 * pris en charge. La cotation vise une structure, l'affectation une personne.
 */
export type VueRegistre =
  | "tous"
  | "nonCotes"
  | "aAffecter"
  | "affectes"
  | "horsDelai"
  | "urgents"
  | "clotures";

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

/* ------------------------------------------------------------------ *
 *  Le cahier de decharge — A-11
 *
 *  Au Port, l'agent cote signe un cahier pour prouver qu'il a recu le pli.
 *  Une ligne par affectation, et non par courrier : un courrier cote a deux
 *  structures produit deux remises distinctes.
 * ------------------------------------------------------------------ */

/** Une ligne du cahier. `etat` est deduit par le serveur, jamais stocke. */
export interface LigneDecharge {
  id: number;
  courrierId: number;
  reference: string;
  objet: string;
  destinataire: string;
  structure: string;
  remise: string;
  /** Le coursier, quand la structure le note. « — » sinon. */
  coursier: string;
  recepteur: string;
  decharge: string;
  /** « Signé », « En attente », « Non retourné ». */
  etat: string;
}

export const accusesQuery = (vue: string) =>
  queryOptions({
    queryKey: ["courrier", "accuses", vue],
    queryFn: ({ signal }) => api.get<LigneDecharge[]>(`/accuses?vue=${vue}`, signal),
  });

/**
 * L'agent signe sa decharge — « j'ai bien reçu ce courrier ».
 *
 * Les deux champs sont facultatifs : un pli remis en main propre n'a pas de
 * coursier, et une structure qui a cesse de tenir le cahier papier n'est pas
 * empechee d'accuser a l'ecran.
 */
export function useAccepterCourrier(courrierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      affectationId,
      ...corps
    }: {
      affectationId: number;
      remisPar?: string;
      referenceCahier?: string;
    }) =>
      api.post<CourrierDetail>(
        `/courriers/${courrierId}/affectations/${affectationId}/accuse`,
        corps,
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

/* ------------------------------------------------------------------ *
 *  Les ecarts signales — A-12
 * ------------------------------------------------------------------ */

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
    }) => api.post<Signalement>(`/courriers/${courrierId}/signalements`, corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

/**
 * Fait passer l'ecart a l'etat suivant — ouvert, pris en compte, clos.
 *
 * `etat` est ce que l'ecran croit atteindre : le serveur le compare a l'etat
 * reellement suivant et refuse s'ils different. Deux agents qui ouvrent le meme
 * signalement voient tous deux « prendre en compte », et le second ne doit pas
 * clore sans l'avoir voulu.
 */
export function useAvancerSignalement() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      signalementId,
      ...corps
    }: {
      signalementId: number;
      etat?: string;
      suiteDonnee?: string;
    }) => api.post<Signalement>(`/signalements/${signalementId}/etat`, corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
      client.invalidateQueries({ queryKey: ["courrier", "signalements"] });
    },
  });
}

/**
 * Porte une observation au fil du courrier.
 *
 * Il n'y a ni modification ni suppression, et ce n'est pas un oubli : tout
 * lecteur ecrit, tout lecteur lit, jamais modifiable (arbitrage du Port,
 * 26 aout 2026). La table elle-meme ne porte pas les colonnes qui les rendraient
 * possibles.
 */
export function usePublierObservation(courrierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (texte: string) =>
      api.post<CourrierDetail>(`/courriers/${courrierId}/observations`, { texte }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

/**
 * Enregistre le traitement de l'agent — le brouillon.
 *
 * Un seul traitement par agent et par courrier, repris a chaque
 * enregistrement : d'ou une ressource au singulier. Le serveur refuse tant que
 * la decharge n'est pas signee (ADR 035), et le message qu'il rend le dit.
 */
export function useEnregistrerTraitement(courrierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (contenu: string) =>
      api.post<CourrierDetail>(`/courriers/${courrierId}/traitement`, { contenu }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

/**
 * Rend le traitement au responsable de structure — l'etape RESTITUE.
 *
 * Ce n'est pas une soumission a validation : le Port ne connait aucun visa sur
 * le courrier arrive (ADR 034). Le responsable lit, puis cloture ou retourne.
 */
export function useRestituerTraitement(courrierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (contenu: string) =>
      api.post<CourrierDetail>(`/courriers/${courrierId}/restitution`, { contenu }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

/** Le responsable rend le traitement a son auteur, avec un motif obligatoire. */
export function useRetournerTraitement(courrierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { traitementId: number; motif: string }) =>
      api.post<CourrierDetail>(
        `/courriers/${courrierId}/traitements/${corps.traitementId}/retour`,
        { motif: corps.motif },
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

/**
 * Cloture le courrier — la fin du trajet, et elle est definitive.
 *
 * `malgreLesBrouillons` est un second clic, pas une option : le premier appel
 * echoue en nommant qui ecrit encore, et le responsable confirme ensuite.
 */
export function useCloturerCourrier(courrierId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { observation?: string; malgreLesBrouillons?: boolean }) =>
      api.post<CourrierDetail>(`/courriers/${courrierId}/cloture`, corps),
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
 *  L'import d'e-mails n'existe pas — §3.6
 *
 *  « Pas d'import d'e-mail pour le moment » : le Port, 26 aout 2026. La file
 *  d'interception, son ecran et ses types ont ete retires ce jour-la plutot que
 *  laisses a repondre 404. Ils reviendront quand la boite existera, et §3.6
 *  restera a documenter d'ici la — ni le protocole, ni qui qualifie, ne sont
 *  connus.
 * ------------------------------------------------------------------ */

/* ---------------------------------------------------------------------
   Bureau d'ordre de structure — A-02b

   Au Port, le bureau d'ordre d'une structure est son **point focal**.
   --------------------------------------------------------------------- */

/** Les trois piles d'un bureau d'ordre réel. */
export type EtatPassage = "a_accuser" | "en_cours" | "sortis";

/** Les cinq façons de sortir d'une structure. */
export type MotifSortie = "reponse" | "retour" | "transmission" | "cloture" | "autre";

export const LIBELLES_MOTIF_SORTIE: Record<MotifSortie, string> = {
  reponse: "Réponse transmise",
  retour: "Retour au bureau d'ordre central",
  transmission: "Transmis à une autre structure",
  cloture: "Clôturé",
  autre: "Autre",
};

export interface LignePassage {
  id: number;
  courrierId: number;
  numero: string;
  objet: string;
  correspondant: string;
  nature: string | null;
  structure: string;
  structureId: number;
  etape: string;
  entreLe: string;
  accuseLe: string | null;
  accusePar: string | null;
  sortiLe: string | null;
  sortiPar: string | null;
  motifSortie: MotifSortie | null;
  noteSortie: string | null;
  joursDansLaStructure: number;
  /**
   * Le temps mort du bureau d'ordre : entre l'arrivée et le tampon.
   *
   * `null` tant que l'accusé n'est pas posé, et non zéro : le compteur court
   * toujours, et l'afficher comme une durée acquise ferait passer un courrier
   * oublié depuis trois jours pour un courrier reçu à l'instant.
   */
  heuresAvantAccuse: number | null;
}

export const bureauOrdreQuery = (etat: EtatPassage, structureId?: number) =>
  queryOptions({
    queryKey: ["courrier", "bureau-ordre", etat, structureId ?? null],
    queryFn: ({ signal }) => {
      const p = new URLSearchParams({ etat });
      if (structureId) p.set("structure", String(structureId));
      return api.get<LignePassage[]>(`/courriers/bureau-ordre?${p}`, signal);
    },
  });

export function useAccuserReception() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (passageId: number) =>
      api.post<LignePassage>(`/courriers/passages/${passageId}/accuse`, {}),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

export function usePrononcerSortie() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      passageId,
      ...corps
    }: {
      passageId: number;
      motif: MotifSortie | "";
      note: string | null;
    }) => api.post<LignePassage>(`/courriers/passages/${passageId}/sortie`, corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesCourrier.racine });
    },
  });
}

/* ---------------------------------------------------------------------
   Supervision des délais — le mapping de la DSR
   --------------------------------------------------------------------- */

export interface LigneBlocage {
  courrierId: number;
  numero: string;
  objet: string;
  correspondant: string;
  etape: string;
  echeance: string | null;
  joursDepassement: number;
  /** Le responsable exact. `null` quand personne n'est encore nommé — c'est le blocage. */
  detenteur: string | null;
  structure: string | null;
  motif: string;
  depuis: string;
  joursImmobilise: number;
}

export interface CarteBlocages {
  lignes: LigneBlocage[];
  total: number;
  arreteLe: string;
  resume: { libelle: string; valeur: string; ton: "neutre" | "succes" | "alerte" }[];
}

export const supervisionQuery = (structureId?: number, seuil = 0) =>
  queryOptions({
    queryKey: ["courrier", "supervision", structureId ?? null, seuil],
    queryFn: ({ signal }) => {
      const p = new URLSearchParams();
      if (structureId) p.set("structure", String(structureId));
      if (seuil) p.set("seuil", String(seuil));
      const chaine = p.toString();
      return api.get<CarteBlocages>(`/courriers/supervision${chaine ? `?${chaine}` : ""}`, signal);
    },
  });
