import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NiveauFeu } from "@/lib/feu";

/**
 * Domaine « gouvernance » — le cœur du dispositif de la DSR.
 *
 * Trois registres que le descriptif fonctionnel tient pour distincts, et qui
 * le sont réellement :
 *
 *  — les décisions des instances (§3.3), qui engagent des structures et qu'il
 *    faut suivre jusqu'à leur exécution ;
 *  — les réunions et rapports (§3.3), dont la DSR assure le secrétariat et la
 *    conservation ;
 *  — la disponibilité des hauts responsables (§3.3), qui conditionne les deux
 *    autres : une décision confiée à un directeur en mission n'avancera pas.
 *
 * Le lien avec le courrier est volontairement lâche. Une décision peut donner
 * lieu à un courrier, à une activité ou à rien de traçable ; l'inverse est
 * faux. Modéliser ce lien comme une dépendance forte aurait obligé à créer un
 * courrier fictif pour chaque décision verbale du Directeur général.
 */

/** Instance qui a rendu la décision. Détermine qui peut la clore. */
export type Instance = "Conseil d'administration" | "CODIR" | "Directeur général" | "Assemblée générale";

export type EtatDecision = "À lancer" | "En cours" | "Exécutée" | "En retard" | "Suspendue";

export interface StructureChargee {
  id: number;
  sigle: string;
  libelle: string;
  /** Rang 1 : structure pilote, celle qui rend compte. Même règle que le chef de file. */
  pilote: boolean;
  avancement: number;
}

export interface Decision {
  id: number;
  reference: string;
  instance: Instance;
  /** Séance dont la décision est issue : « CODIR du 12 juin 2026 ». */
  seance: string;
  objet: string;
  dateDecision: string;
  echeance: string | null;
  etat: EtatDecision;
  avancement: number;
  feu: NiveauFeu;
  structures: StructureChargee[];
  /** Nombre de relances déjà parties. Une décision relancée trois fois est un signal. */
  relances: number;
}

export interface JalonDecision {
  id: number;
  libelle: string;
  echeance: string;
  fait: boolean;
  dateRealisation: string | null;
  structure: string;
}

export interface ObservationDecision {
  id: number;
  auteur: string;
  initiales: string;
  poste: string;
  date: string;
  texte: string;
  /** Une relance de la DSR n'est pas une observation ordinaire : elle se voit. */
  relance: boolean;
}

export interface DecisionDetail extends Decision {
  contexte: string;
  origine: { type: "Réunion" | "Session" | "Instruction verbale"; libelle: string; id: number | null };
  jalons: JalonDecision[];
  observations: ObservationDecision[];
  /** Ce que la décision a produit : courriers, activités, dossiers. */
  retombees: { type: string; libelle: string; reference: string; chemin: string | null }[];
}

export interface RegistreDecisions {
  decisions: Decision[];
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
  total: number;
}

export type TypeSeance =
  | "Réunion présidée par le DG"
  | "Session du Conseil d'administration"
  | "Assemblée générale"
  | "CODIR"
  | "Rapport d'activité"
  | "Rapport sectoriel";

/** État du dépôt du compte rendu, au regard du délai de transmission. */
export type EtatDepot = "Déposé" | "En attente" | "Hors délai";

export interface Seance {
  id: number;
  reference: string;
  type: TypeSeance;
  intitule: string;
  date: string;
  president: string;
  participants: number;
  /** Documents attendus : ordre du jour, compte rendu, procès-verbal. */
  depot: EtatDepot;
  dateDepot: string | null;
  echeanceDepot: string;
  decisionsIssues: number;
  structure: string;
}

export interface DocumentSeance {
  id: number;
  nature: "Ordre du jour" | "Compte rendu" | "Procès-verbal" | "Dossier de séance" | "Rapport";
  libelle: string;
  depose: boolean;
  dateDepot: string | null;
  poids: string | null;
  deposePar: string | null;
}

export interface SeanceDetail extends Seance {
  ordreDuJour: { id: number; rang: number; point: string; rapporteur: string }[];
  documents: DocumentSeance[];
  presents: { nom: string; initiales: string; poste: string; present: boolean }[];
  decisions: { id: number; reference: string; objet: string; etat: EtatDecision }[];
}

export interface RegistreSeances {
  seances: Seance[];
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
  total: number;
}

export type TypeAbsence = "Congé annuel" | "Mission" | "Intérim" | "Formation" | "Absence exceptionnelle";

export interface Disponibilite {
  id: number;
  responsable: string;
  initiales: string;
  poste: string;
  structure: string;
  type: TypeAbsence;
  du: string;
  au: string;
  jours: number;
  /** Qui assure la suppléance. Sans lui, les dossiers de la structure s'arrêtent. */
  interimaire: string | null;
  interimaireInitiales: string | null;
  /** Une absence sans intérimaire désigné est le point que la DSR doit voir. */
  feu: NiveauFeu;
  enCours: boolean;
  saisiPar: string;
}

export interface RegistreDisponibilites {
  disponibilites: Disponibilite[];
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
  /** Responsables absents sans intérim désigné, à la date du jour. */
  sansInterim: number;
}

/**
 * Tableau de bord du dispositif — niveau 2 de l'architecture de restitution.
 *
 * Il agrège les trois registres en une seule vue : ce qui est en retard, ce
 * qui manque, qui est absent sans suppléance. C'est l'écran d'accueil de la
 * DSR et du CODIR, et il vit dans la charte de l'espace de travail — pas dans
 * celle de l'administration, qui est réservée au paramétrage de l'outil.
 */
export interface TableauDeBordGouvernance {
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
  /** Décisions qui appellent une relance, les plus critiques d'abord. */
  aRelancer: Decision[];
  /** Comptes rendus attendus ou déjà hors délai. */
  depotsEnSouffrance: Seance[];
  /** Absences en cours sans intérimaire désigné. */
  absencesSansInterim: Disponibilite[];
  /** Répartition des décisions par instance, pour la barre du haut. */
  parInstance: { instance: Instance; total: number; enRetard: number }[];
}

/* ------------------------------------------------------------------ *
 *  Filiales et succursales — §3.3
 *
 *  « Suivre la préparation des sessions des organes de gestion des filiales
 *  et succursales et la mise en œuvre de leurs prescriptions. »
 *
 *  La DSR n'y siège pas : elle prépare les dossiers de séance et vérifie
 *  ensuite que ce qui a été prescrit est exécuté. D'où les deux moitiés de
 *  l'écran — l'amont (le dossier est-il prêt) et l'aval (la prescription
 *  est-elle suivie d'effet).
 * ------------------------------------------------------------------ */

export type NatureEntite = "Filiale" | "Succursale";

export type OrganeType = "Conseil d'administration" | "Assemblée générale" | "Comité de gestion";

export type EtatPreparation = "À préparer" | "Dossier en cours" | "Dossier transmis" | "Tenue";

export interface OrganeGestion {
  id: number;
  entite: string;
  sigle: string;
  nature: NatureEntite;
  organe: OrganeType;
  prochaineSession: string;
  etatPreparation: EtatPreparation;
  documentsAttendus: number;
  documentsRecus: number;
  feu: NiveauFeu;
  prescriptionsTotal: number;
  prescriptionsExecutees: number;
  prescriptionsEnRetard: number;
}

export interface PrescriptionFiliale {
  id: number;
  reference: string;
  entite: string;
  objet: string;
  sessionOrigine: string;
  echeance: string;
  avancement: number;
  etat: EtatDecision;
  feu: NiveauFeu;
}

export interface SuiviFiliales {
  organes: OrganeGestion[];
  prescriptions: PrescriptionFiliale[];
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
}

/* ------------------------------------------------------------------ *
 *  Représentation du PAD à l'extérieur — §3.3
 *
 *  « Suivre la représentation du PAD dans les associations et organisations
 *  portuaires/maritimes, ainsi que la mise en œuvre des avis et
 *  recommandations des regroupements externes. »
 *
 *  Deux objets distincts : le mandat — qui nous représente, jusqu'à quand,
 *  avec quelle assiduité — et la recommandation, qui engage une structure
 *  interne exactement comme une décision d'instance.
 * ------------------------------------------------------------------ */

export type NatureOrganisation =
  | "Comité national"
  | "Organisation portuaire"
  | "Association professionnelle"
  | "Groupement";

export interface Representation {
  id: number;
  organisation: string;
  sigle: string;
  nature: NatureOrganisation;
  representant: string;
  initiales: string;
  suppleant: string | null;
  mandatDu: string;
  mandatAu: string;
  reunionsTenues: number;
  reunionsParticipees: number;
  tauxParticipation: number;
  feu: NiveauFeu;
  /** Ce que l'institution retire de sa présence. Vide quand rien n'est déclaré. */
  apport: string | null;
}

export interface RecommandationExterne {
  id: number;
  reference: string;
  organisation: string;
  objet: string;
  emiseLe: string;
  echeance: string | null;
  structurePilote: string;
  avancement: number;
  etat: EtatDecision;
  feu: NiveauFeu;
}

export interface SuiviRepresentations {
  representations: Representation[];
  recommandations: RecommandationExterne[];
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
}

/* ------------------------------------------------------------------ *
 *  Planning annuel des congés — §3.3
 *
 *  « Confectionner les projets de planning des congés annuels des Directeurs
 *  de services et membres du Cabinet du DG, en liaison avec la DRH. »
 *
 *  À ne pas confondre avec le registre de disponibilité : celui-ci enregistre
 *  une absence décidée, celui-là arbitre des souhaits avant qu'ils ne le
 *  deviennent. C'est l'écran où l'on voit qu'un départ prive une direction de
 *  toute sa ligne hiérarchique en même temps.
 * ------------------------------------------------------------------ */

export type EtatConge = "Souhaité" | "Arbitré" | "Validé" | "Reporté";

export interface PeriodeConge {
  id: number;
  du: string;
  au: string;
  jours: number;
  etat: EtatConge;
}

export interface LigneConges {
  id: number;
  responsable: string;
  initiales: string;
  poste: string;
  structure: string;
  droits: number;
  planifies: number;
  solde: number;
  periodes: PeriodeConge[];
  feu: NiveauFeu;
}

export interface ConflitConges {
  periode: string;
  structure: string;
  responsables: string[];
}

export interface PlanningConges {
  annee: number;
  lignes: LigneConges[];
  conflits: ConflitConges[];
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
}

const CLE = "gouvernance";

export const filialesQuery = () =>
  queryOptions({
    queryKey: [CLE, "filiales"],
    queryFn: ({ signal }) => api.get<SuiviFiliales>("/gouvernance/filiales", signal),
  });

export const representationsQuery = () =>
  queryOptions({
    queryKey: [CLE, "representations"],
    queryFn: ({ signal }) => api.get<SuiviRepresentations>("/gouvernance/representations", signal),
  });

export const planningCongesQuery = (annee: number) =>
  queryOptions({
    queryKey: [CLE, "conges", annee],
    queryFn: ({ signal }) => api.get<PlanningConges>(`/gouvernance/conges?annee=${annee}`, signal),
    placeholderData: (precedent) => precedent,
  });

export const tableauDeBordGouvernanceQuery = () =>
  queryOptions({
    queryKey: [CLE, "tableau-de-bord"],
    queryFn: ({ signal }) =>
      api.get<TableauDeBordGouvernance>("/gouvernance/tableau-de-bord", signal),
  });

export const registreDecisionsQuery = (instance: string, etat: string) =>
  queryOptions({
    queryKey: [CLE, "decisions", instance, etat],
    queryFn: ({ signal }) =>
      api.get<RegistreDecisions>(
        `/gouvernance/decisions?instance=${encodeURIComponent(instance)}&etat=${encodeURIComponent(etat)}`,
        signal,
      ),
    placeholderData: (precedent) => precedent,
  });

export const decisionQuery = (id: number) =>
  queryOptions({
    queryKey: [CLE, "decision", id],
    queryFn: ({ signal }) => api.get<DecisionDetail>(`/gouvernance/decisions/${id}`, signal),
  });

export const registreSeancesQuery = (type: string) =>
  queryOptions({
    queryKey: [CLE, "seances", type],
    queryFn: ({ signal }) =>
      api.get<RegistreSeances>(`/gouvernance/seances?type=${encodeURIComponent(type)}`, signal),
    placeholderData: (precedent) => precedent,
  });

export const seanceQuery = (id: number) =>
  queryOptions({
    queryKey: [CLE, "seance", id],
    queryFn: ({ signal }) => api.get<SeanceDetail>(`/gouvernance/seances/${id}`, signal),
  });

export const registreDisponibilitesQuery = (filtre: string) =>
  queryOptions({
    queryKey: [CLE, "disponibilites", filtre],
    queryFn: ({ signal }) =>
      api.get<RegistreDisponibilites>(
        `/gouvernance/disponibilites?filtre=${encodeURIComponent(filtre)}`,
        signal,
      ),
    placeholderData: (precedent) => precedent,
  });

/* ------------------------------------------------------------------ *
 *  Ecritures
 *
 *  Chaque mutation invalide la cle du domaine plutot que la seule liste
 *  concernee : creer une decision change aussi les compteurs du tableau de
 *  bord et les alertes du cockpit. Invalider trop large coute un aller-retour ;
 *  invalider trop juste laisse des chiffres faux a l'ecran, ce qui coute la
 *  confiance dans l'outil.
 * ------------------------------------------------------------------ */

export interface SaisieDecision {
  instance: Instance;
  seance: string;
  objet: string;
  contexte: string;
  dateDecision: string;
  echeance: string | null;
  /** Identifiants dans l'ordre : le premier est la structure pilote. */
  structures: number[];
}

export interface SaisieAvancement {
  decisionId: number;
  avancement: number;
  observation: string;
  jalonsFaits: number[];
}

export interface SaisieRelance {
  decisionId: number;
  motif: string;
  /** Destinataire : la structure pilote par defaut. */
  structureId: number | null;
}

export interface SaisieSeance {
  type: TypeSeance;
  intitule: string;
  date: string;
  president: string;
  structure: string;
  echeanceDepot: string;
  ordreDuJour: { point: string; rapporteur: string }[];
}

export interface SaisieDocument {
  seanceId: number;
  nature: DocumentSeance["nature"];
  libelle: string;
  nomFichier: string;
  poids: string;
}

export interface SaisieAbsence {
  responsable: string;
  poste: string;
  structure: string;
  type: TypeAbsence;
  du: string;
  au: string;
  interimaire: string | null;
}

export interface SaisieStructure {
  libelle: string;
  sigle: string;
  /** Direction, service, division, filiale ou succursale. */
  nature: string;
  niveau: number;
  responsable: string | null;
}

function useEcriture<TCorps>(chemin: string | ((corps: TCorps) => string)) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (corps: TCorps) =>
      api.post<{ id: number }>(typeof chemin === "function" ? chemin(corps) : chemin, corps),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [CLE] });
      // Le cockpit et les tableaux de bord agregent la gouvernance : ils
      // doivent bouger en meme temps, sans quoi deux ecrans se contredisent.
      void client.invalidateQueries({ queryKey: ["pilotage"] });
      void client.invalidateQueries({ queryKey: ["performance"] });
    },
  });
}

export const useCreerDecision = () => useEcriture<SaisieDecision>("/gouvernance/decisions");

export const useConsignerAvancement = () =>
  useEcriture<SaisieAvancement>((corps) => `/gouvernance/decisions/${corps.decisionId}/avancement`);

export const useRelancer = () =>
  useEcriture<SaisieRelance>((corps) => `/gouvernance/decisions/${corps.decisionId}/relance`);

export const useCreerSeance = () => useEcriture<SaisieSeance>("/gouvernance/seances");

export const useDeposerDocument = () =>
  useEcriture<SaisieDocument>((corps) => `/gouvernance/seances/${corps.seanceId}/documents`);

export const useDeclarerAbsence = () => useEcriture<SaisieAbsence>("/gouvernance/disponibilites");

export const useCreerStructure = () => useEcriture<SaisieStructure>("/gouvernance/structures");
