import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NiveauFeu } from "@/lib/feu";

/**
 * Cockpit exécutif et tableaux de bord de structure — niveaux 1 et 2.
 *
 * Séparé de `api.ts`, qui sert le tableau de bord du courrier : ce sont deux
 * restitutions différentes, sur des sources différentes, et les mélanger dans
 * un même fichier aurait fini par mélanger leurs types.
 *
 * Le cockpit est décrit au §3.1 comme une « vue unique tenant sur un seul
 * écran, agrégeant automatiquement le taux global d'exécution des activités,
 * le nombre de décisions en retard, les structures à risque, la disponibilité
 * des hauts responsables et les alertes actives classées par criticité ».
 *
 * Cette contrainte — un écran, sans défilement — est ce qui décide de tout le
 * reste. Chaque bloc doit gagner sa place, et rien n'y entre qui ne demande
 * une décision. Sur téléphone, la contrainte tombe : à 390 px, aucune vue
 * d'ensemble ne tient sans faire défiler, et prétendre le contraire
 * produirait des chiffres illisibles.
 */

export type Criticite = "Critique" | "Élevée" | "Modérée";

export interface Alerte {
  id: number;
  criticite: Criticite;
  libelle: string;
  precision: string;
  /** Où aller pour agir. `null` quand l'écran n'existe pas encore. */
  chemin: string | null;
  structure: string | null;
}

export interface EngagementDG {
  id: number;
  reference: string;
  objet: string;
  origine: "Instruction du Directeur général" | "Résolution du Conseil d'administration";
  echeance: string | null;
  avancement: number;
  feu: NiveauFeu;
  enRetard: boolean;
}

export interface IndicateurCockpit {
  libelle: string;
  valeur: string;
  /** Évolution par rapport à la période précédente, déjà formatée. */
  variation: string | null;
  favorable: boolean | null;
}

export interface Cockpit {
  periode: string;
  /** Les quatre chiffres qui ouvrent la vue. */
  executionActivites: number;
  decisionsEnRetard: number;
  structuresARisque: number;
  absencesSansInterim: number;
  /**
   * Activités critiques — §20.
   *
   * Comptées ici mais restituées par les alertes : une activité critique
   * appelle un arbitrage, et un cinquième chiffre aurait dilué les quatre
   * autres sans rien dire de plus que la ligne d'alerte qui la nomme.
   */
  activitesCritiques: number;
  alertes: Alerte[];
  engagements: EngagementDG[];
  indicateurs: IndicateurCockpit[];
  /** Extrêmes du classement : les trois premières et les trois dernières. */
  meilleures: { sigle: string; score: number; feu: NiveauFeu }[];
  fragiles: { sigle: string; score: number; feu: NiveauFeu }[];
}

/**
 * Tableau de bord d'une structure — niveaux 2 et 3 confondus.
 *
 * Le descriptif les distingue par le périmètre, pas par le contenu : le point
 * focal voit sa seule structure (niveau 3), le responsable voit sa branche et
 * la DSR toutes (niveau 2). C'est donc un seul écran, dont le sélecteur de
 * structure n'apparaît qu'à qui peut en changer.
 */
export interface BlocTableauStructure {
  libelle: string;
  valeur: string;
  note: string;
  feu: NiveauFeu;
}

export interface TableauStructure {
  structureSigle: string;
  structureLibelle: string;
  /** Structures que le périmètre de la session autorise à consulter. */
  structuresAccessibles: { sigle: string; libelle: string }[];
  periode: string;
  rang: number | null;
  totalStructures: number;
  scoreGlobal: number | null;
  feu: NiveauFeu;
  activites: BlocTableauStructure[];
  courrier: BlocTableauStructure[];
  rituels: BlocTableauStructure[];
  /** Ce qui appelle une action dans cette structure, tous piliers confondus. */
  aTraiter: { libelle: string; precision: string; feu: NiveauFeu; chemin: string | null }[];
}

/** Note de synthèse produite avant une instance — §3.1 et §3.2. */
export interface SyntheseInstance {
  instance: string;
  seance: string;
  dateSeance: string;
  producteur: string;
  periode: string;
  faitsMarquants: string[];
  executionActivites: number;
  decisionsEchues: number;
  decisionsExecutees: number;
  classement: { rang: number; sigle: string; libelle: string; score: number; feu: NiveauFeu }[];
  pointsDAttention: { titre: string; texte: string; feu: NiveauFeu }[];
}

/* ------------------------------------------------------------------ *
 *  Analyses croisées — §3.11
 *
 *  « Exploiter l'entrepôt de données consolidé pour produire des analyses
 *  croisées entre exécution des activités, traitement du courrier,
 *  avancement des dossiers et respect des délais. »
 *
 *  Le contrôleur de gestion ne cherche pas un chiffre, il cherche un lien.
 *  D'où une ligne par structure portant les quatre mesures ensemble, plutôt
 *  que quatre écrans qui obligeraient à les rapprocher de tête.
 * ------------------------------------------------------------------ */

export interface LigneCroisee {
  sigle: string;
  libelle: string;
  /** Taux d'exécution du plan d'actions. */
  activites: number;
  /** Taux de courriers traités dans le délai imparti. */
  courrier: number;
  /** Taux de dossiers instruits dans le délai. */
  dossiers: number;
  /** Taux de respect des délais, toutes natures confondues. */
  delais: number;
  feu: NiveauFeu;
  /** Écart entre la meilleure et la moins bonne des quatre mesures. */
  dispersion: number;
}

export interface AnalysesCroisees {
  periode: string;
  lignes: LigneCroisee[];
  moyennes: { activites: number; courrier: number; dossiers: number; delais: number };
  /**
   * Constats tirés des données, formulés par le serveur.
   * Ils décrivent ce qu'on voit ; ils n'expliquent rien.
   */
  constats: { texte: string; feu: NiveauFeu }[];
}

/**
 * Indicateurs cibles du programme — §3.11 et §9 du BRD.
 *
 * « Suivre les indicateurs cibles du programme et leur évolution N vs N-1. »
 * Chaque ligne porte donc trois valeurs : l'année en cours, l'année passée, et
 * la cible. Sans l'année passée, une valeur ne dit pas si l'on progresse ; sans
 * la cible, elle ne dit pas si cela suffit.
 */
export interface IndicateurProgramme {
  code: string;
  libelle: string;
  modeCalcul: string;
  source: string;
  unite: string;
  valeurN: number | null;
  valeurN1: number | null;
  cible: number;
  /** Vrai quand la cible est un plafond à ne pas dépasser. */
  cibleMaximum: boolean;
  echeance: string;
  feu: NiveauFeu;
}

export interface SuiviProgramme {
  annee: number;
  indicateurs: IndicateurProgramme[];
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
}

const CLE = "pilotage";

export const analysesQuery = () =>
  queryOptions({
    queryKey: [CLE, "analyses"],
    queryFn: ({ signal }) => api.get<AnalysesCroisees>("/pilotage/analyses", signal),
  });

export const programmeQuery = (annee: number) =>
  queryOptions({
    queryKey: [CLE, "programme", annee],
    queryFn: ({ signal }) => api.get<SuiviProgramme>(`/pilotage/programme?annee=${annee}`, signal),
    placeholderData: (precedent) => precedent,
  });

export const cockpitQuery = () =>
  queryOptions({
    queryKey: [CLE, "cockpit"],
    queryFn: ({ signal }) => api.get<Cockpit>("/pilotage/cockpit", signal),
  });

export const tableauStructureQuery = (sigle: string) =>
  queryOptions({
    queryKey: [CLE, "structure", sigle],
    queryFn: ({ signal }) =>
      api.get<TableauStructure>(`/pilotage/structures?sigle=${encodeURIComponent(sigle)}`, signal),
    placeholderData: (precedent) => precedent,
  });

export const syntheseQuery = () =>
  queryOptions({
    queryKey: [CLE, "synthese"],
    queryFn: ({ signal }) => api.get<SyntheseInstance>("/pilotage/synthese", signal),
  });
