import type {
  CritereScore,
  IndicateurDictionnaire,
  LigneCalendrier,
  NiveauRisque,
  SousIndicateur,
} from "@/features/performance/api";
import { feuDepuisTaux } from "@/lib/feu";

/**
 * Jeu de démonstration de la matrice de scoring.
 *
 * La pondération des quatre critères vient normalement du paramétrage : c'est
 * un choix de gouvernance que la DSR administre. Elle est figée ici parce que
 * l'écran de paramétrage des pondérations n'existe pas encore — il viendra
 * avec le dictionnaire des indicateurs, qui en est le support naturel.
 */
export const CRITERES = [
  { code: "ACT", libelle: "Exécution des activités", poids: 35 },
  { code: "COU", libelle: "Traitement du courrier", poids: 30 },
  { code: "RIT", libelle: "Conformité aux rituels", poids: 20 },
  { code: "DOS", libelle: "Instruction des dossiers", poids: 15 },
] as const;

/** Notes brutes par structure et par critère, sur 100. */
const NOTES: Record<string, { libelle: string; notes: Record<string, number>; rangPrecedent: number | null }> = {
  DSR: { libelle: "Division du suivi et de la relance", notes: { ACT: 92, COU: 88, RIT: 96, DOS: 85 }, rangPrecedent: 1 },
  DSI: { libelle: "Direction des systèmes d'information", notes: { ACT: 88, COU: 82, RIT: 90, DOS: 78 }, rangPrecedent: 3 },
  DG: { libelle: "Direction générale", notes: { ACT: 84, COU: 90, RIT: 82, DOS: 80 }, rangPrecedent: 2 },
  SCC: { libelle: "Service du courrier central", notes: { ACT: 74, COU: 94, RIT: 68, DOS: 70 }, rangPrecedent: 4 },
  DCG: { libelle: "Direction du contrôle de gestion", notes: { ACT: 80, COU: 72, RIT: 78, DOS: 74 }, rangPrecedent: 5 },
  DRH: { libelle: "Direction des ressources humaines", notes: { ACT: 76, COU: 70, RIT: 72, DOS: 68 }, rangPrecedent: 7 },
  CDA: { libelle: "Centre de la documentation et des archives", notes: { ACT: 70, COU: 66, RIT: 74, DOS: 72 }, rangPrecedent: 6 },
  DAF: { libelle: "Direction des affaires financières", notes: { ACT: 44, COU: 62, RIT: 54, DOS: 58 }, rangPrecedent: 8 },
  DTX: { libelle: "Direction des travaux", notes: { ACT: 38, COU: 58, RIT: 46, DOS: 50 }, rangPrecedent: 9 },
  DF: { libelle: "Direction du foncier", notes: { ACT: 52, COU: 48, RIT: 58, DOS: 44 }, rangPrecedent: 10 },
};

export function criteresDe(sigle: string): CritereScore[] {
  const notes = NOTES[sigle].notes;
  return CRITERES.map((critere) => ({
    code: critere.code,
    libelle: critere.libelle,
    poids: critere.poids,
    note: notes[critere.code],
    feu: feuDepuisTaux(notes[critere.code]),
  }));
}

export function scoreGlobal(sigle: string): number {
  const notes = NOTES[sigle].notes;
  const total = CRITERES.reduce((somme, c) => somme + notes[c.code] * c.poids, 0);
  return Math.round(total / 100);
}

/** Classement du mois, meilleur score en tête. */
export function classement() {
  return Object.keys(NOTES)
    .map((sigle) => ({
      structureSigle: sigle,
      structureLibelle: NOTES[sigle].libelle,
      scoreGlobal: scoreGlobal(sigle),
      feu: feuDepuisTaux(scoreGlobal(sigle)),
      criteres: criteresDe(sigle),
      rangPrecedent: NOTES[sigle].rangPrecedent,
    }))
    .sort((a, b) => b.scoreGlobal - a.scoreGlobal)
    .map((ligne, index) => ({ ...ligne, rang: index + 1 }));
}

export const existeStructure = (sigle: string) => sigle in NOTES;
export const libelleStructure = (sigle: string) => NOTES[sigle]?.libelle ?? sigle;

/**
 * Décomposition d'un critère.
 *
 * C'est ce niveau qui rend le classement discutable, au bon sens du terme : un
 * directeur qui conteste sa note doit pouvoir désigner la ligne qui le pénalise.
 */
export function sousIndicateurs(sigle: string, code: string): SousIndicateur[] {
  const note = NOTES[sigle].notes[code];
  // Les sous-indicateurs sont derives de la note du critere, pour rester
  // coherents avec elle sans avoir a saisir dix valeurs par structure.
  const autour = (ecart: number) => Math.max(0, Math.min(100, note + ecart));

  const tables: Record<string, SousIndicateur[]> = {
    ACT: [
      { libelle: "Taux d'exécution du plan d'actions", valeur: `${autour(0)} %`, cible: "85 %", taux: autour(0), feu: feuDepuisTaux(autour(0)) },
      { libelle: "Activités déclarées dans les délais", valeur: `${autour(6)} %`, cible: "90 %", taux: autour(6), feu: feuDepuisTaux(autour(6)) },
      { libelle: "Écart moyen à l'avancement attendu", valeur: `${Math.round((100 - note) / 4)} pts`, cible: "0 pt", taux: autour(-4), feu: feuDepuisTaux(autour(-4)) },
    ],
    COU: [
      { libelle: "Courriers traités dans le délai imparti", valeur: `${autour(0)} %`, cible: "90 %", taux: autour(0), feu: feuDepuisTaux(autour(0)) },
      { libelle: "Délai moyen de traitement", valeur: `${(12 - note / 12).toFixed(1)} j`, cible: "5,0 j", taux: autour(3), feu: feuDepuisTaux(autour(3)) },
      { libelle: "Accusés de réception retournés", valeur: `${autour(-5)} %`, cible: "100 %", taux: autour(-5), feu: feuDepuisTaux(autour(-5)) },
    ],
    RIT: [
      { libelle: "Réunions de service tenues", valeur: `${Math.round(autour(0) / 100 * 12)} / 12`, cible: "12", taux: autour(0), feu: feuDepuisTaux(autour(0)) },
      { libelle: "Comptes rendus déposés dans les délais", valeur: `${autour(-8)} %`, cible: "90 %", taux: autour(-8), feu: feuDepuisTaux(autour(-8)) },
      { libelle: "Rapports mensuels transmis", valeur: `${Math.round(autour(4) / 100 * 7)} / 7`, cible: "7", taux: autour(4), feu: feuDepuisTaux(autour(4)) },
    ],
    DOS: [
      { libelle: "Dossiers instruits dans le délai", valeur: `${autour(0)} %`, cible: "85 %", taux: autour(0), feu: feuDepuisTaux(autour(0)) },
      { libelle: "Dossiers retournés pour complément", valeur: `${Math.round((100 - note) / 5)} %`, cible: "< 5 %", taux: autour(2), feu: feuDepuisTaux(autour(2)) },
    ],
  };

  return tables[code] ?? [];
}

/** Douze derniers mois, avec une progression plausible vers le score courant. */
export function historique(sigle: string): { periode: string; score: number }[] {
  const cible = scoreGlobal(sigle);
  const mois = ["sept.", "oct.", "nov.", "déc.", "janv.", "févr.", "mars", "avr.", "mai", "juin", "juil."];
  return mois.map((libelle, index) => ({
    periode: libelle,
    // Depart 8 points sous le score actuel, avec une oscillation reguliere.
    score: Math.max(0, Math.min(100, Math.round(cible - 8 + index * 0.7 + (index % 3) * 2 - 2))),
  }));
}

export const INDICATEURS_DICTIONNAIRE: IndicateurDictionnaire[] = [
  {
    id: 1,
    code: "ACT-EXE",
    libelle: "Taux d'exécution du plan d'actions",
    definition: "Part des activités du plan annuel dont l'avancement déclaré atteint l'avancement attendu à la date d'observation.",
    formule: "activités à l'attendu ÷ activités suivies × 100",
    source: "Module Activités — déclarations des points focaux",
    periodicite: "Mensuelle",
    responsable: "DSR",
    unite: "%",
    seuilVert: 85,
    seuilOrange: 60,
    critere: "Exécution des activités",
    actif: true,
  },
  {
    id: 2,
    code: "COU-DEL",
    libelle: "Taux de respect des délais de traitement",
    definition: "Part des courriers clos dont la date de clôture est antérieure à l'échéance fixée à la cotation.",
    formule: "courriers clos dans le délai ÷ courriers clos × 100",
    source: "Module Courrier — journal des étapes",
    periodicite: "Mensuelle",
    responsable: "DSR",
    unite: "%",
    seuilVert: 90,
    seuilOrange: 70,
    critere: "Traitement du courrier",
    actif: true,
  },
  {
    id: 3,
    code: "COU-MOY",
    libelle: "Délai moyen de traitement d'un courrier",
    definition: "Moyenne du nombre de jours ouvrés entre la cotation à une structure et la clôture du courrier.",
    formule: "somme des délais ÷ nombre de courriers clos",
    source: "Module Courrier — journal des étapes",
    periodicite: "Mensuelle",
    responsable: "DSR",
    unite: "jours",
    seuilVert: 5,
    seuilOrange: 10,
    critere: "Traitement du courrier",
    actif: true,
  },
  {
    id: 4,
    code: "RIT-CR",
    libelle: "Ponctualité de dépôt des comptes rendus",
    definition: "Part des comptes rendus de réunion déposés avant l'échéance du calendrier de production.",
    formule: "dépôts dans le délai ÷ dépôts attendus × 100",
    source: "Module Gouvernance — registre des réunions",
    periodicite: "Mensuelle",
    responsable: "DSR",
    unite: "%",
    seuilVert: 90,
    seuilOrange: 70,
    critere: "Conformité aux rituels",
    actif: true,
  },
  {
    id: 5,
    code: "RIT-RAP",
    libelle: "Transmission des rapports mensuels d'activité",
    definition: "Nombre de rapports mensuels reçus par la DSR, rapporté au nombre de structures assujetties.",
    formule: "rapports reçus ÷ structures assujetties × 100",
    source: "Module Activités — obligations de reporting",
    periodicite: "Mensuelle",
    responsable: "DSR",
    unite: "%",
    seuilVert: 95,
    seuilOrange: 75,
    critere: "Conformité aux rituels",
    actif: true,
  },
  {
    id: 6,
    code: "DEC-EXE",
    libelle: "Taux d'exécution des décisions des instances",
    definition: "Part des décisions arrivées à échéance dont l'exécution est déclarée complète.",
    formule: "décisions exécutées ÷ décisions échues × 100",
    source: "Module Gouvernance — registre des décisions",
    periodicite: "Mensuelle",
    responsable: "DSR",
    unite: "%",
    seuilVert: 90,
    seuilOrange: 70,
    critere: null,
    actif: true,
  },
  {
    id: 7,
    code: "DOS-INS",
    libelle: "Dossiers instruits dans le délai",
    definition: "Part des dossiers administratifs clos dans le délai de service applicable à leur typologie.",
    formule: "dossiers clos dans le délai ÷ dossiers clos × 100",
    source: "Module Projets et dossiers",
    periodicite: "Mensuelle",
    responsable: "DSR",
    unite: "%",
    seuilVert: 85,
    seuilOrange: 65,
    critere: "Instruction des dossiers",
    actif: false,
  },
  {
    id: 8,
    code: "COU-DEM",
    libelle: "Taux de dématérialisation du courrier",
    definition: "Part des courriers traités sans support papier, du dépôt à la clôture.",
    formule: "courriers sans circulation papier ÷ courriers enregistrés × 100",
    source: "Module Courrier — mode de circulation",
    periodicite: "Trimestrielle",
    responsable: "DSI",
    unite: "%",
    seuilVert: 50,
    seuilOrange: 30,
    critere: null,
    actif: true,
  },
];

export const GRILLE_RISQUES: NiveauRisque[] = [
  {
    niveau: 1,
    libelle: "Maîtrisé",
    description: "Score global supérieur ou égal à 85. Les écarts constatés sont ponctuels et se résorbent d'eux-mêmes.",
    conduite: "Aucune action. La structure figure au tableau d'honneur du CODIR.",
    feu: "vert",
  },
  {
    niveau: 2,
    libelle: "Sous surveillance",
    description: "Score entre 60 et 84, ou un critère isolé sous 60. L'écart est installé mais reste réversible.",
    conduite: "Relance de la DSR au responsable de structure, avec demande de plan de rattrapage sous quinze jours.",
    feu: "orange",
  },
  {
    niveau: 3,
    libelle: "Critique",
    description: "Score inférieur à 60, ou deux critères sous 60, ou trois mois consécutifs en surveillance.",
    conduite: "Inscription à l'ordre du jour du CODIR. Le responsable présente son plan de redressement en séance.",
    feu: "rouge",
  },
  {
    niveau: 4,
    libelle: "Non évaluable",
    description: "Données manquantes sur un ou plusieurs critères : la structure n'a pas alimenté ses registres.",
    conduite: "La non-saisie vaut signalement. Relance immédiate, et mention au rapport mensuel du Directeur général.",
    feu: "inconnu",
  },
];

export const CALENDRIER_DEMO: LigneCalendrier[] = [
  {
    id: 1,
    production: "Rapport mensuel d'activité",
    nature: "Rapport",
    periodicite: "Mensuelle",
    echeance: "le 5 du mois suivant",
    structuresAttendues: 12,
    responsable: "Point focal de chaque structure",
    relanceAutomatique: true,
    joursAvantRelance: 3,
    recus: 10,
    feu: "orange",
  },
  {
    id: 2,
    production: "Compte rendu de réunion de service",
    nature: "Procès-verbal",
    periodicite: "Mensuelle",
    echeance: "5 jours après la séance",
    structuresAttendues: 12,
    responsable: "Secrétaire de séance",
    relanceAutomatique: true,
    joursAvantRelance: 2,
    recus: 11,
    feu: "vert",
  },
  {
    id: 3,
    production: "Déclaration d'avancement des activités",
    nature: "Saisie",
    periodicite: "Mensuelle",
    echeance: "le dernier jour du mois",
    structuresAttendues: 12,
    responsable: "Point focal de chaque structure",
    relanceAutomatique: true,
    joursAvantRelance: 5,
    recus: 9,
    feu: "orange",
  },
  {
    id: 4,
    production: "Plan d'actions annuel",
    nature: "Plan",
    periodicite: "Annuelle",
    echeance: "le 15 janvier",
    structuresAttendues: 12,
    responsable: "Responsable de structure",
    relanceAutomatique: false,
    joursAvantRelance: null,
    recus: 12,
    feu: "vert",
  },
  {
    id: 5,
    production: "Rapport sectoriel",
    nature: "Rapport",
    periodicite: "Semestrielle",
    echeance: "le 31 juillet et le 31 janvier",
    structuresAttendues: 8,
    responsable: "Responsable de structure",
    relanceAutomatique: true,
    joursAvantRelance: 10,
    recus: 6,
    feu: "rouge",
  },
  {
    id: 6,
    production: "Registre de disponibilité des responsables",
    nature: "Saisie",
    periodicite: "Mensuelle",
    echeance: "en continu, contrôle le 1er du mois",
    structuresAttendues: 12,
    responsable: "Point focal de chaque structure",
    relanceAutomatique: true,
    joursAvantRelance: 2,
    recus: 8,
    feu: "rouge",
  },
  {
    id: 7,
    production: "Synthèse des rapports d'activité",
    nature: "Synthèse",
    periodicite: "Trimestrielle",
    echeance: "le 15 du mois suivant le trimestre",
    structuresAttendues: 1,
    responsable: "DSR",
    relanceAutomatique: false,
    joursAvantRelance: null,
    recus: 1,
    feu: "vert",
  },
];
