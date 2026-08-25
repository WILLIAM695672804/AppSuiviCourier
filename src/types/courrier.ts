/** Etapes du circuit. Ce sont des codes de la base, jamais des libelles d'ecran. */
export type EtapeCourrier =
  | "ENREGISTRE"
  | "COTE"
  | "TRANSMIS"
  | "AFFECTE"
  | "EN_TRAITEMENT"
  | "EN_VALIDATION"
  | "SIGNE"
  | "PARTI"
  | "CLOTURE";

/**
 * Les trois sens d'un courrier.
 *
 * `INTERNE` manquait, et l'ecran « Courriers internes » affichait donc les
 * arrivees : sans sens a transmettre, il retombait sur la valeur par defaut du
 * registre. Le serveur, lui, porte les trois depuis toujours (`courrier.sens`).
 */
export type SensCourrier = "ARRIVEE" | "DEPART" | "INTERNE";

export type PrioriteCourrier = "NORMALE" | "URGENTE" | "TRES_URGENTE";

export interface StructureCotee {
  structureId: number;
  libelle: string;
  rang: number;
  /** rang === 1. Le chef de file coordonne et centralise la reponse. */
  chefDeFile: boolean;
}

export interface Cotation {
  id: number;
  mention: string | null;
  annotation: string | null;
  delaiFixe: string | null;
  /** L'autorite qui a decide — le DG, un responsable. */
  decidePar: { id: number; nomComplet: string };
  decideLe: string;
  /** L'agent qui a saisi. Distinct du precedent : le SCC saisit pour le DG. */
  saisiPar: { id: number; nomComplet: string };
  saisiLe: string;
  structures: StructureCotee[];
}

/**
 * Consommation du delai de traitement, calculee par le serveur.
 * Le client ne compte pas les jours ouvres : c'est une regle metier.
 */
export interface DelaiCourrier {
  joursEcoules: number;
  joursAlloues: number;
  /** Jours au-dela de l'echeance. 0 tant que le delai est tenu. */
  joursDepassement: number;
}

export interface CourrierResume {
  id: number;
  numero: string;
  sens: SensCourrier;
  objet: string;
  correspondant: string;
  nature: string;
  dateReception: string;
  etape: EtapeCourrier;
  priorite: PrioriteCourrier;
  confidentiel: boolean;
  echeance: string | null;
  delai: DelaiCourrier | null;
  /** Structures cotees dans l'ordre : la premiere est le chef de file. */
  structuresCotees: string[];
}

/**
 * Une etape franchie, en cours ou attendue du circuit.
 * Le serveur la construit a partir du journal : le client n'en deduit rien.
 */
export interface EtapeChronologie {
  id: number;
  libelle: string;
  horodatage: string;
  /** « Par A. Kouassi — Cabinet ». Absent pour les etapes automatiques. */
  auteur: string | null;
  precision: string | null;
  /** Consigne portee a cette etape, citee telle quelle. */
  instruction: string | null;
  etat: "faite" | "courante" | "attendue";
}

export interface Observation {
  id: number;
  auteur: string;
  initiales: string;
  fonction: string;
  horodatage: string;
  texte: string;
}

export interface PieceJointe {
  id: number;
  nom: string;
  /** « PDF », « JPG »… affiche dans la pastille. */
  format: string;
  taille: string;
  precision: string | null;
}

export interface ReponseRattachee {
  id: number;
  numero: string;
  objet: string;
  version: number;
  redigePar: string;
  etape: EtapeCourrier;
}

export interface EvenementCourrier {
  id: number;
  libelle: string;
  horodatage: string;
}

export interface CourrierDetail extends CourrierResume {
  sessionLibelle: string;
  referenceExpediteur: string | null;
  enregistrePar: string;
  nombrePages: number;
  nombreAnnexes: number;
  delaiJours: number;
  /** Cascade : une structure apres l'autre. Parallele : toutes en meme temps. */
  modeCotation: "CASCADE" | "PARALLELE" | null;
  cotations: Cotation[];
  chronologie: EtapeChronologie[];
  observations: Observation[];
  piecesJointes: PieceJointe[];
  reponses: ReponseRattachee[];
  /** Trois derniers evenements ; le journal complet est dans la tracabilite. */
  derniersEvenements: EvenementCourrier[];
  /** Permissions de l'utilisateur sur CE courrier, calculees par le serveur. */
  actionsPossibles: string[];
}

/** Le chef de file d'un courrier, ou null s'il n'est pas encore cote. */
export function chefDeFile(courrier: CourrierResume): string | null {
  return courrier.structuresCotees[0] ?? null;
}
