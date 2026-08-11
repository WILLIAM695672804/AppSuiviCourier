import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NiveauFeu } from "@/lib/feu";

/**
 * Domaine « projets et dossiers » — l'instruction des demandes administratives.
 *
 * C'est le processus que le BRD retient comme périmètre pilote (§6.1) :
 * « réception et enregistrement, qualification et affectation, instruction,
 * validation hiérarchique à un ou plusieurs niveaux selon des seuils définis,
 * notification au demandeur, puis archivage ».
 *
 * Trois exigences le structurent :
 *
 *  — RF-BPM-02 : l'affectation est **dynamique**, décidée par des règles
 *    métier — rôle, service, seuil de montant, criticité. L'instructeur doit
 *    savoir pourquoi ce dossier lui est arrivé, sinon la règle est vécue comme
 *    de l'arbitraire ;
 *  — RF-BPM-06 : le retour à une étape antérieure exige un **motif
 *    obligatoire**, et ne perd rien de l'historique ;
 *  — RF-GED-04 : les pièces sont **versionnées sans écrasement**. Une pièce
 *    remplacée reste consultable, faute de quoi on ne peut plus dire sur quoi
 *    la décision a été prise.
 *
 * Le lien avec le courrier est unidirectionnel : un courrier entrant peut
 * donner naissance à un dossier (§3.6), jamais l'inverse. Le dossier garde la
 * référence de son courrier d'origine, et c'est tout.
 */

export type TypeDossier = "Demande" | "Réclamation" | "Autorisation" | "Requête" | "Acte";

export type EtapeDossier =
  | "Qualification"
  | "Instruction"
  | "Validation"
  | "Notification"
  | "Clos";

export type EtatDossier =
  | "En cours"
  | "En attente de complément"
  | "Retourné"
  | "Hors délai"
  | "Clos";

export type Criticite = "Standard" | "Sensible" | "Urgent";

export interface Dossier {
  id: number;
  reference: string;
  objet: string;
  type: TypeDossier;
  demandeur: string;
  structure: string;
  instructeur: string;
  initiales: string;
  ouvertLe: string;
  echeance: string;
  etape: EtapeDossier;
  etat: EtatDossier;
  criticite: Criticite;
  feu: NiveauFeu;
  /** Négatif quand l'échéance est dépassée. */
  joursRestants: number;
  /** Référence du courrier dont le dossier est issu, s'il en a un. */
  courrierOrigine: string | null;
  courrierOrigineId: number | null;
}

/** Une version d'une pièce. La courante est la dernière déposée. */
export interface VersionPiece {
  version: number;
  deposeLe: string;
  deposePar: string;
  taille: string;
  courante: boolean;
}

export interface PieceDossier {
  id: number;
  nom: string;
  format: string;
  versions: VersionPiece[];
}

export type TypeEvenementDossier =
  | "Ouverture"
  | "Affectation"
  | "Demande de complément"
  | "Complément reçu"
  | "Dépôt de pièce"
  | "Projet de réponse"
  | "Retour à l'étape antérieure"
  | "Validation"
  | "Notification"
  | "Clôture";

export interface EvenementDossier {
  id: number;
  type: TypeEvenementDossier;
  date: string;
  auteur: string;
  initiales: string;
  poste: string;
  texte: string;
  /** Renseignés sur un retour : d'où l'on vient, où l'on retourne. */
  etapeAvant: EtapeDossier | null;
  etapeApres: EtapeDossier | null;
}

export interface Complement {
  id: number;
  objet: string;
  demandeLe: string;
  demandePar: string;
  echeance: string;
  recuLe: string | null;
}

export interface DossierDetail extends Dossier {
  contexte: string;
  /**
   * Pourquoi ce dossier est arrivé ici — RF-BPM-02.
   * Sans cette phrase, l'affectation dynamique passe pour de l'arbitraire.
   */
  regleAffectation: string;
  seuil: string | null;
  etapes: { code: EtapeDossier; libelle: string; franchie: boolean; date: string | null; acteur: string | null }[];
  pieces: PieceDossier[];
  complements: Complement[];
  historique: EvenementDossier[];
}

export interface RegistreDossiers {
  dossiers: Dossier[];
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
  total: number;
}

/** Modèle de courrier-type — RF-SUI-05, fusion de documents. */
export interface ModeleCourrier {
  id: number;
  code: string;
  libelle: string;
  typologie: string;
  description: string;
  /** Champs remplacés à la fusion : « demandeur », « reference »… */
  variables: string[];
  corps: string;
  misAJourLe: string;
  misAJourPar: string;
  utilisations: number;
}

const CLE = "dossier";

export const registreDossiersQuery = (etape: string, etat: string) =>
  queryOptions({
    queryKey: [CLE, "registre", etape, etat],
    queryFn: ({ signal }) =>
      api.get<RegistreDossiers>(
        `/dossiers?etape=${encodeURIComponent(etape)}&etat=${encodeURIComponent(etat)}`,
        signal,
      ),
    placeholderData: (precedent) => precedent,
  });

export const dossierQuery = (id: number) =>
  queryOptions({
    queryKey: [CLE, "fiche", id],
    queryFn: ({ signal }) => api.get<DossierDetail>(`/dossiers/${id}`, signal),
  });

export const modelesQuery = () =>
  queryOptions({
    queryKey: [CLE, "modeles"],
    queryFn: ({ signal }) => api.get<{ modeles: ModeleCourrier[] }>("/dossiers/modeles", signal),
  });

/* ------------------------------------------------------------------ *
 *  Ecritures
 * ------------------------------------------------------------------ */

export interface SaisieComplement {
  dossierId: number;
  objet: string;
  echeance: string;
}

export interface SaisieRetour {
  dossierId: number;
  etapeCible: EtapeDossier;
  motif: string;
}

export interface SaisieFusion {
  dossierId: number;
  modeleId: number;
  valeurs: Record<string, string>;
}

export interface SaisieDossierDepuisCourrier {
  courrierId: number;
  type: TypeDossier;
  objet: string;
  demandeur: string;
  echeance: string;
}

function useEcriture<TCorps>(chemin: string | ((corps: TCorps) => string)) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (corps: TCorps) =>
      api.post<{ id: number }>(typeof chemin === "function" ? chemin(corps) : chemin, corps),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [CLE] });
      void client.invalidateQueries({ queryKey: ["pilotage"] });
    },
  });
}

export const useDemanderComplement = () =>
  useEcriture<SaisieComplement>((corps) => `/dossiers/${corps.dossierId}/complements`);

export const useRetournerEtape = () =>
  useEcriture<SaisieRetour>((corps) => `/dossiers/${corps.dossierId}/retour`);

export const useFusionner = () =>
  useEcriture<SaisieFusion>((corps) => `/dossiers/${corps.dossierId}/fusion`);

export const useCreerDossier = () => useEcriture<SaisieDossierDepuisCourrier>("/dossiers");
