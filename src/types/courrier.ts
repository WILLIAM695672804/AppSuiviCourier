/**
 * Les sept etapes du trajet d'un courrier arrive. Ce sont des codes de la base,
 * jamais des libelles d'ecran.
 *
 * Le Port a decrit ce trajet le 26 aout 2026 :
 *
 *     enregistre -> cote -> affecte -> accepte -> en traitement
 *                -> restitue -> cloture
 *
 * `TRANSMIS`, `SIGNE` et `PARTI` ont ete **retires** ce jour-la. Ils relevent du
 * pilier depart, et le serveur ne les a jamais emis : un type qui annonce une
 * valeur impossible se lit comme une specification et fait filtrer un ecran sur
 * du vide.
 *
 * `ACCEPTE` est la decharge — l'agent cote a signe le cahier. `RESTITUE`
 * remplace `EN_VALIDATION` : le traitement rendu attend son responsable de
 * structure, pas une validation hierarchique qui n'existe pas.
 */
export type EtapeCourrier =
  | "ENREGISTRE"
  | "COTE"
  | "AFFECTE"
  | "ACCEPTE"
  | "EN_TRAITEMENT"
  | "RESTITUE"
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
  /**
   * L'affectation de CELUI qui lit, s'il en a une. `null` pour tous les autres :
   * un courrier qu'on lit sans l'avoir recu ne se decharge pas.
   */
  monAffectation: MonAffectation | null;
  /** Le traitement de CELUI qui lit, s'il en a ouvert un : ce que la zone de
   *  redaction recharge. `null` pour qui n'a rien ecrit. */
  monTraitement: Traitement | null;
  /** Les traitements des autres, cloisonnes comme les gestes internes. Un
   *  brouillon n'y figure jamais : seul son auteur le voit. */
  traitements: Traitement[];
  /** Les ecarts signales sur ce courrier que ce lecteur a le droit de suivre. */
  signalements: Signalement[];
  piecesJointes: PieceJointe[];
  reponses: ReponseRattachee[];
  /** Trois derniers evenements ; le journal complet est dans la tracabilite. */
  derniersEvenements: EvenementCourrier[];
  /** Permissions de l'utilisateur sur CE courrier, calculees par le serveur. */
  actionsPossibles: string[];
}

/**
 * Ce que le lecteur de la fiche a recu, et s'il l'a decharge.
 *
 * `accepteLe` a `null` veut dire « le pli m'est attribue, je n'ai pas signe » :
 * c'est le seul etat ou le bouton de decharge s'affiche.
 */
export interface MonAffectation {
  id: number;
  affecteLe: string;
  consigne: string | null;
  accepteLe: string | null;
}

/**
 * Ce qu'un agent a ecrit du courrier, et ou en est ce texte.
 *
 * `statut` porte le code du socle, `statutLibelle` la phrase que l'ecran
 * affiche : le front filtre sur l'un et rend l'autre, plutot que d'entretenir
 * une seconde table de traduction.
 */
export interface Traitement {
  id: number;
  redacteur: string;
  redacteurId: number;
  structure: string;
  version: number;
  contenu: string;
  statut: "brouillon" | "soumis" | "retourne" | "valide";
  statutLibelle: string;
  /** L'heure de la restitution. `null` tant que c'est un brouillon. */
  restitueLe: string | null;
  modifieLe: string;
}

/** Un ecart constate sur le circuit papier — A-12. */
export interface Signalement {
  id: number;
  courrierId: number;
  reference: string;
  /** Libelle du type, deja traduit par le serveur. */
  type: string;
  typeCode: string;
  gravite: string;
  detail: string;
  destinataire: string;
  emisPar: string;
  emisLe: string;
  /** « Ouvert », « Pris en compte », « Clos ». */
  etat: string;
  etatCode: "ouvert" | "pris_en_compte" | "clos";
  suiteDonnee: string | null;
  /** Calcule par le serveur : seule la structure visee fait avancer l'ecart. */
  peutAvancer: boolean;
}

/** Le chef de file d'un courrier, ou null s'il n'est pas encore cote. */
export function chefDeFile(courrier: CourrierResume): string | null {
  return courrier.structuresCotees[0] ?? null;
}
