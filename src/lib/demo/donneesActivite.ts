import type {
  ActiviteDetail,
  Activite,
  EtatPlan,
  Obligation,
} from "@/features/activite/api";

/**
 * Jeu de démonstration du pilier « activités ».
 *
 * Les cas couvrent les quatre situations qu'un tableau de bord doit savoir
 * distinguer : l'activité en avance, celle qui suit son rythme, celle qui a
 * pris du retard sans que personne ne le signale, et celle qui est suspendue
 * sur instruction. L'écart entre l'avancement réel et l'avancement attendu est
 * ce qui les sépare — un taux de 40 % est excellent en février et alarmant en
 * novembre.
 *
 * Deux cas ont été ajoutés pour couvrir ce que le cahier des charges demande et
 * que le jeu initial ne montrait pas : une instruction du DG encore due avec
 * son délai (§17), et une suspension portant son motif et sa référence de
 * décision (§19).
 */

export const ACTIVITES_DEMO: ActiviteDetail[] = [
  {
    id: 1,
    reference: "PAA-DSI-07",
    intitule: "Déployer la dématérialisation au bureau d'ordre",
    axe: "Port innovant et responsable",
    structureSigle: "DSI",
    structureLibelle: "Direction des systèmes d'information",
    responsable: "T. Owona",
    initiales: "TO",
    debut: "2026-03-01",
    fin: "2026-12-31",
    etat: "En cours",
    avancement: 70,
    avancementAttendu: 58,
    feu: "vert",
    tachesFaites: 4,
    tachesTotal: 6,
    instructions: 1,
    critique: false,
    objectif:
      "Supprimer la double saisie entre le registre papier et l'application, et ramener le délai d'enregistrement d'un courrier sous trente secondes.",
    etatReferenceGeneral: "100 % des courriers enregistrés à la main sur registre papier, délai moyen de 4 minutes.",
    resultatsAttendus:
      "Le bureau d'ordre enregistre dans l'application seule ; le registre papier n'est plus tenu qu'en secours.",
    budgetValide: 42000000,
    suspension: null,
    derniereRelance: null,
    indicateurs: [
      { id: 1, libelle: "Courriers enregistrés dans l'application", unite: "%", etatReference: "0", cible: "90", realise: "64", taux: 71, releveLe: "2026-08-01" },
      { id: 2, libelle: "Délai moyen d'enregistrement", unite: "s", etatReference: "240", cible: "30", realise: "48", taux: 91, releveLe: "2026-08-01" },
      { id: 3, libelle: "Agents formés", unite: "agents", etatReference: "0", cible: "12", realise: "9", taux: 75, releveLe: "2026-07-24" },
    ],
    taches: [
      { id: 1, libelle: "Recensement des flux du bureau d'ordre", echeance: "2026-04-15", fait: true, dateRealisation: "2026-04-10", responsable: "T. Owona" },
      { id: 2, libelle: "Paramétrage des typologies documentaires", echeance: "2026-05-30", fait: true, dateRealisation: "2026-05-28", responsable: "A. Kouassi" },
      { id: 3, libelle: "Formation des agents de session", echeance: "2026-07-31", fait: true, dateRealisation: "2026-07-24", responsable: "T. Owona" },
      { id: 4, libelle: "Bascule du registre arrivée", echeance: "2026-09-15", fait: true, dateRealisation: "2026-08-02", responsable: "K. Traoré" },
      { id: 5, libelle: "Bascule du registre départ", echeance: "2026-10-31", fait: false, dateRealisation: null, responsable: "K. Traoré" },
      { id: 6, libelle: "Arrêt du registre papier", echeance: "2026-12-15", fait: false, dateRealisation: null, responsable: "T. Owona" },
    ],
    instructionsRattachees: [
      {
        id: 1,
        origine: "Instruction verbale",
        reference: null,
        texte: "Avancer la bascule du registre arrivée : ne pas attendre septembre.",
        date: "2026-07-22",
        auteur: "N'Guessan Y.",
        responsable: "K. Traoré",
        echeance: "2026-08-05",
        levee: true,
        dateLevee: "2026-08-02",
      },
    ],
    vie: [
      { id: 1, type: "Création", date: "2026-02-14", auteur: "T. Owona", initiales: "TO", poste: "Administrateur technique", texte: "Activité inscrite au plan d'actions 2026.", pieces: [] },
      { id: 2, type: "Validation", date: "2026-03-02", auteur: "C. Abena", initiales: "CA", poste: "Contrôleur de gestion", texte: "Plan validé, budget de 42 000 000 F CFA confirmé.", pieces: [] },
      { id: 3, type: "Instruction verbale", date: "2026-07-22", auteur: "N'Guessan Y.", initiales: "NY", poste: "Directeur général", texte: "Avancer la bascule du registre arrivée : ne pas attendre septembre. Délai au 5 août, sous la responsabilité de K. Traoré.", pieces: [] },
      { id: 4, type: "Modification", date: "2026-07-23", auteur: "T. Owona", initiales: "TO", poste: "Administrateur technique", texte: "Échéance de la bascule arrivée ramenée du 15 septembre au 5 août.", pieces: [] },
      {
        id: 5,
        type: "Observation",
        date: "2026-08-02",
        auteur: "K. Traoré",
        initiales: "KT",
        poste: "Agent de session courrier",
        texte: "Bascule effectuée. Le registre papier reste tenu en parallèle jusqu'à fin août.",
        pieces: [{ id: 1, nom: "PV-bascule-registre-arrivee.pdf", poids: "1,2 Mo" }],
      },
    ],
  },
  {
    id: 2,
    reference: "PAA-DAF-03",
    intitule: "Réduire le délai de traitement des factures fournisseurs",
    axe: "Port attractif et performant",
    structureSigle: "DAF",
    structureLibelle: "Direction des affaires financières",
    responsable: "S. Bamba",
    initiales: "SB",
    debut: "2026-01-15",
    fin: "2026-12-31",
    etat: "En retard",
    avancement: 34,
    avancementAttendu: 60,
    feu: "rouge",
    tachesFaites: 2,
    tachesTotal: 6,
    instructions: 2,
    /*
     * Le cas type de l'activité critique au sens du §20 : un écart de 26 points
     * et, par-dessus, une instruction du Directeur général dont le délai est
     * passé. Un retard seul ne suffit pas à faire une criticité.
     */
    critique: true,
    objectif: "Ramener à quinze jours le délai moyen entre la réception d'une facture et son ordonnancement.",
    etatReferenceGeneral: "Délai moyen constaté de 38 jours sur l'exercice 2025.",
    resultatsAttendus: "Aucune facture au-delà de trente jours ; délai moyen sous quinze jours au 31 décembre.",
    budgetValide: 8500000,
    suspension: null,
    derniereRelance: "2026-08-04",
    indicateurs: [
      { id: 4, libelle: "Délai moyen d'ordonnancement", unite: "jours", etatReference: "38", cible: "15", realise: "31", taux: 30, releveLe: "2026-07-31" },
      { id: 5, libelle: "Factures au-delà de 30 jours", unite: "%", etatReference: "44", cible: "0", realise: "28", taux: 36, releveLe: "2026-07-31" },
    ],
    taches: [
      { id: 7, libelle: "Cartographie du circuit de la facture", echeance: "2026-03-15", fait: true, dateRealisation: "2026-03-12", responsable: "S. Bamba" },
      { id: 8, libelle: "Suppression du double visa", echeance: "2026-05-31", fait: true, dateRealisation: "2026-06-18", responsable: "S. Bamba" },
      { id: 9, libelle: "Numérisation à réception", echeance: "2026-07-31", fait: false, dateRealisation: null, responsable: "M. Diallo" },
      { id: 10, libelle: "Tableau de suivi hebdomadaire", echeance: "2026-08-31", fait: false, dateRealisation: null, responsable: "M. Diallo" },
      { id: 11, libelle: "Relance automatique des visas en attente", echeance: "2026-10-15", fait: false, dateRealisation: null, responsable: "T. Owona" },
      { id: 12, libelle: "Bilan et ajustement", echeance: "2026-12-15", fait: false, dateRealisation: null, responsable: "S. Bamba" },
    ],
    instructionsRattachees: [
      {
        id: 2,
        origine: "Instruction verbale",
        reference: null,
        texte: "La numérisation à réception doit être effective avant la fin août, sans exception.",
        date: "2026-07-22",
        auteur: "N'Guessan Y.",
        responsable: "M. Diallo",
        echeance: "2026-08-31",
        levee: false,
        dateLevee: null,
      },
      {
        id: 3,
        origine: "Décision du DG",
        reference: "CODIR-2026-094",
        texte:
          "Rendre compte au Comité de direction du plan de résorption des factures en souffrance.",
        date: "2026-08-06",
        auteur: "N'Guessan Y.",
        responsable: "S. Bamba",
        echeance: "2026-08-20",
        levee: false,
        dateLevee: null,
      },
    ],
    vie: [
      { id: 6, type: "Création", date: "2026-01-08", auteur: "S. Bamba", initiales: "SB", poste: "Chef de service comptabilité", texte: "Activité inscrite au plan d'actions 2026.", pieces: [] },
      { id: 7, type: "Validation", date: "2026-01-20", auteur: "C. Abena", initiales: "CA", poste: "Contrôleur de gestion", texte: "Plan validé.", pieces: [] },
      { id: 8, type: "Relance", date: "2026-07-15", auteur: "F. Ngo Bell", initiales: "FN", poste: "Chef de la DSR", texte: "Deux tâches en retard, aucun avancement déclaré depuis juin. Relance adressée à la DAF.", pieces: [] },
      { id: 9, type: "Instruction verbale", date: "2026-07-22", auteur: "N'Guessan Y.", initiales: "NY", poste: "Directeur général", texte: "La numérisation à réception doit être effective avant la fin août, sans exception. Délai au 31 août, sous la responsabilité de M. Diallo.", pieces: [] },
      { id: 10, type: "Relance", date: "2026-08-04", auteur: "F. Ngo Bell", initiales: "FN", poste: "Chef de la DSR", texte: "Seconde relance. L'écart avec l'avancement attendu atteint 26 points.", pieces: [] },
      { id: 11, type: "Décision du DG", date: "2026-08-06", auteur: "N'Guessan Y.", initiales: "NY", poste: "Directeur général", texte: "CODIR-2026-094 : rendre compte au Comité de direction du plan de résorption des factures en souffrance. Délai au 20 août, sous la responsabilité de S. Bamba.", pieces: [] },
    ],
  },
  {
    id: 3,
    reference: "PAA-DSR-01",
    intitule: "Généraliser le dépôt des rapports mensuels d'activité",
    axe: "Port innovant et responsable",
    structureSigle: "DSR",
    structureLibelle: "Division du suivi et de la relance",
    responsable: "F. Ngo Bell",
    initiales: "FN",
    debut: "2026-01-01",
    fin: "2026-09-30",
    etat: "En cours",
    avancement: 82,
    avancementAttendu: 80,
    feu: "vert",
    tachesFaites: 4,
    tachesTotal: 5,
    instructions: 0,
    critique: false,
    objectif: "Obtenir de chaque direction un rapport mensuel déposé avant le 5 du mois suivant.",
    etatReferenceGeneral: "Sept directions sur douze déposaient un rapport, avec un retard moyen de onze jours.",
    resultatsAttendus: "Douze directions sur douze, taux de ponctualité supérieur à 90 %.",
    budgetValide: null,
    suspension: null,
    derniereRelance: null,
    indicateurs: [
      { id: 6, libelle: "Directions déposantes", unite: "directions", etatReference: "7", cible: "12", realise: "11", taux: 92, releveLe: "2026-08-05" },
      { id: 7, libelle: "Taux de ponctualité", unite: "%", etatReference: "42", cible: "90", realise: "78", taux: 87, releveLe: "2026-08-05" },
    ],
    taches: [
      { id: 13, libelle: "Modèle de rapport diffusé", echeance: "2026-02-28", fait: true, dateRealisation: "2026-02-20", responsable: "F. Ngo Bell" },
      { id: 14, libelle: "Calendrier de production publié", echeance: "2026-03-31", fait: true, dateRealisation: "2026-03-26", responsable: "F. Ngo Bell" },
      { id: 15, libelle: "Désignation des points focaux", echeance: "2026-08-15", fait: true, dateRealisation: "2026-08-01", responsable: "F. Ngo Bell" },
      { id: 16, libelle: "Relances automatiques activées", echeance: "2026-08-31", fait: true, dateRealisation: "2026-07-30", responsable: "T. Owona" },
      { id: 17, libelle: "Bilan de ponctualité au troisième trimestre", echeance: "2026-09-30", fait: false, dateRealisation: null, responsable: "F. Ngo Bell" },
    ],
    instructionsRattachees: [],
    vie: [
      { id: 12, type: "Création", date: "2025-12-18", auteur: "F. Ngo Bell", initiales: "FN", poste: "Chef de la DSR", texte: "Activité inscrite au plan d'actions 2026.", pieces: [] },
      { id: 13, type: "Validation", date: "2026-01-12", auteur: "C. Abena", initiales: "CA", poste: "Contrôleur de gestion", texte: "Plan validé sans budget dédié.", pieces: [] },
      { id: 14, type: "Décision du DG", date: "2026-06-12", auteur: "N'Guessan Y.", initiales: "NY", poste: "Directeur général", texte: "CODIR-2026-088 : la tenue mensuelle des réunions de service est généralisée, avec dépôt du compte rendu sous cinq jours.", pieces: [] },
    ],
  },
  {
    id: 4,
    reference: "PAA-DAF-05",
    intitule: "Fiabiliser l'inventaire physique des immobilisations",
    axe: "Port attractif et performant",
    structureSigle: "DAF",
    structureLibelle: "Direction des affaires financières",
    responsable: "S. Bamba",
    initiales: "SB",
    debut: "2026-06-01",
    fin: "2026-11-30",
    etat: "Programmée",
    avancement: 0,
    avancementAttendu: 30,
    feu: "rouge",
    tachesFaites: 0,
    tachesTotal: 3,
    instructions: 0,
    /*
     * Critique elle aussi, mais pour l'autre motif : aucune instruction ne pèse
     * dessus, en revanche la première tâche a dépassé son échéance sans qu'un
     * avancement soit déclaré.
     */
    critique: true,
    objectif: "Rapprocher l'inventaire comptable de l'inventaire physique sur l'ensemble des sites.",
    etatReferenceGeneral: "Dernier inventaire physique complet en 2023, écart non chiffré depuis.",
    resultatsAttendus: "Écart inférieur à 2 % entre inventaire physique et comptable.",
    budgetValide: 15000000,
    suspension: null,
    derniereRelance: null,
    indicateurs: [
      { id: 8, libelle: "Sites inventoriés", unite: "sites", etatReference: "0", cible: "9", realise: null, taux: null, releveLe: null },
    ],
    taches: [
      { id: 18, libelle: "Constitution des équipes d'inventaire", echeance: "2026-06-30", fait: false, dateRealisation: null, responsable: "S. Bamba" },
      { id: 19, libelle: "Inventaire des sites portuaires", echeance: "2026-09-30", fait: false, dateRealisation: null, responsable: "S. Bamba" },
      { id: 20, libelle: "Rapprochement et régularisation", echeance: "2026-11-30", fait: false, dateRealisation: null, responsable: "S. Bamba" },
    ],
    instructionsRattachees: [],
    vie: [
      { id: 15, type: "Création", date: "2026-01-08", auteur: "S. Bamba", initiales: "SB", poste: "Chef de service comptabilité", texte: "Activité inscrite au plan d'actions 2026.", pieces: [] },
      { id: 16, type: "Validation", date: "2026-01-20", auteur: "C. Abena", initiales: "CA", poste: "Contrôleur de gestion", texte: "Plan validé.", pieces: [] },
    ],
  },
  {
    id: 5,
    reference: "PAA-DTX-02",
    intitule: "Étendre le terminal à conteneurs — phase préparatoire",
    axe: "Port compétitif et fluide",
    structureSigle: "DTX",
    structureLibelle: "Direction des travaux",
    responsable: "Direction des travaux",
    initiales: "DT",
    debut: "2026-02-01",
    fin: "2026-12-31",
    etat: "Suspendue",
    avancement: 15,
    avancementAttendu: 55,
    feu: "inconnu",
    tachesFaites: 1,
    tachesTotal: 4,
    instructions: 0,
    // Une activité suspendue n'est jamais critique : son retard ne court plus.
    critique: false,
    objectif: "Préparer le dossier technique et financier de l'extension du terminal.",
    etatReferenceGeneral: "Étude de faisabilité de 2024, non actualisée.",
    resultatsAttendus: "Dossier complet présentable au Conseil d'administration.",
    budgetValide: 120000000,
    suspension: {
      motif: "Exécution suspendue jusqu'à réception de l'étude d'impact environnemental.",
      reference: "CA-2026-011",
      decidePar: "N'Guessan Y., Directeur général",
      date: "2026-06-26",
    },
    derniereRelance: null,
    indicateurs: [],
    taches: [
      { id: 21, libelle: "Actualisation de l'étude de faisabilité", echeance: "2026-04-30", fait: true, dateRealisation: "2026-04-22", responsable: "Direction des travaux" },
      { id: 22, libelle: "Étude d'impact environnemental", echeance: "2026-08-31", fait: false, dateRealisation: null, responsable: "Cabinet externe" },
      { id: 23, libelle: "Chiffrage définitif", echeance: "2026-10-31", fait: false, dateRealisation: null, responsable: "Direction des travaux" },
      { id: 24, libelle: "Dossier de présentation au CA", echeance: "2026-12-15", fait: false, dateRealisation: null, responsable: "Direction des travaux" },
    ],
    instructionsRattachees: [],
    vie: [
      { id: 17, type: "Création", date: "2026-01-15", auteur: "Direction des travaux", initiales: "DT", poste: "Direction des travaux", texte: "Activité inscrite au plan d'actions 2026.", pieces: [] },
      {
        id: 18,
        type: "Décision du DG",
        date: "2026-06-26",
        auteur: "N'Guessan Y.",
        initiales: "NY",
        poste: "Directeur général",
        texte: "CA-2026-011 : exécution suspendue jusqu'à réception de l'étude d'impact environnemental.",
        pieces: [{ id: 2, nom: "CA-2026-011-extrait.pdf", poids: "340 Ko" }],
      },
    ],
  },
  {
    id: 6,
    reference: "PAA-DRH-04",
    intitule: "Publier le planning annuel des congés des directeurs",
    axe: "Port innovant et responsable",
    structureSigle: "DRH",
    structureLibelle: "Direction des ressources humaines",
    responsable: "L. Mbarga",
    initiales: "LM",
    debut: "2026-01-01",
    fin: "2026-07-31",
    etat: "Réalisée",
    avancement: 100,
    avancementAttendu: 100,
    feu: "vert",
    tachesFaites: 3,
    tachesTotal: 3,
    instructions: 0,
    critique: false,
    objectif: "Établir et publier, en liaison avec la DSR, le planning des congés des directeurs et du Cabinet.",
    etatReferenceGeneral: "Congés déclarés au fil de l'eau, sans visibilité d'ensemble.",
    resultatsAttendus: "Planning publié avant le 31 juillet, tenu à jour dans le registre de disponibilité.",
    budgetValide: null,
    suspension: null,
    derniereRelance: null,
    indicateurs: [
      { id: 9, libelle: "Directeurs couverts par le planning", unite: "%", etatReference: "0", cible: "100", realise: "100", taux: 100, releveLe: "2026-07-18" },
    ],
    taches: [
      { id: 25, libelle: "Recueil des souhaits", echeance: "2026-04-30", fait: true, dateRealisation: "2026-04-28", responsable: "L. Mbarga" },
      { id: 26, libelle: "Arbitrage avec la DSR", echeance: "2026-06-30", fait: true, dateRealisation: "2026-06-25", responsable: "F. Ngo Bell" },
      { id: 27, libelle: "Publication du planning", echeance: "2026-07-31", fait: true, dateRealisation: "2026-07-18", responsable: "L. Mbarga" },
    ],
    instructionsRattachees: [],
    vie: [
      { id: 19, type: "Création", date: "2026-01-06", auteur: "L. Mbarga", initiales: "LM", poste: "Point focal", texte: "Activité inscrite au plan d'actions 2026.", pieces: [] },
      { id: 20, type: "Validation", date: "2026-01-20", auteur: "C. Abena", initiales: "CA", poste: "Contrôleur de gestion", texte: "Plan validé sans budget dédié.", pieces: [] },
      {
        id: 21,
        type: "Observation",
        date: "2026-07-18",
        auteur: "L. Mbarga",
        initiales: "LM",
        poste: "Point focal",
        texte: "Planning publié et versé au registre de disponibilité. Activité close.",
        pieces: [{ id: 3, nom: "Planning-conges-directeurs-2026.pdf", poids: "620 Ko" }],
      },
    ],
  },
];

/**
 * État de validation du plan, structure par structure.
 *
 * Une seule variable ne pouvait pas suffire : le §15 fait valider un plan par
 * structure, et la corbeille du contrôle de gestion n'a d'objet que si les
 * douze plans peuvent être dans douze états différents. Les activités restent
 * la matière ; ceci n'est que l'état de l'engagement qui les porte.
 */
export interface EtatPlanStructure {
  structureSigle: string;
  structureLibelle: string;
  etat: EtatPlan;
  soumisLe: string | null;
  valideLe: string | null;
  validePar: string | null;
  motifRetour: string | null;
}

export const PLANS_DEMO: EtatPlanStructure[] = [
  {
    structureSigle: "DAF",
    structureLibelle: "Direction des affaires financières",
    etat: "Validé",
    soumisLe: "2026-01-12",
    valideLe: "2026-01-20",
    validePar: "C. Abena, contrôleur de gestion",
    motifRetour: null,
  },
  {
    structureSigle: "DSI",
    structureLibelle: "Direction des systèmes d'information",
    etat: "Validé",
    soumisLe: "2026-02-18",
    valideLe: "2026-03-02",
    validePar: "C. Abena, contrôleur de gestion",
    motifRetour: null,
  },
  {
    structureSigle: "DSR",
    structureLibelle: "Division du suivi et de la relance",
    etat: "Validé",
    soumisLe: "2025-12-20",
    valideLe: "2026-01-12",
    validePar: "C. Abena, contrôleur de gestion",
    motifRetour: null,
  },
  {
    structureSigle: "DTX",
    structureLibelle: "Direction des travaux",
    etat: "Soumis au contrôle de gestion",
    soumisLe: "2026-08-03",
    valideLe: null,
    validePar: null,
    motifRetour: null,
  },
  {
    structureSigle: "DRH",
    structureLibelle: "Direction des ressources humaines",
    etat: "Retourné",
    soumisLe: "2026-01-09",
    valideLe: null,
    validePar: null,
    motifRetour:
      "Trois activités sans état de référence chiffré : le taux d'avancement qu'elles produiront ne sera comparable à rien.",
  },
];

export const OBLIGATIONS_DEMO: Obligation[] = [
  { id: 1, intitule: "Rapport d'activité — juillet 2026", nature: "Rapport mensuel d'activité", periode: "Juillet 2026", echeance: "2026-08-05", depose: false, dateDepot: null, feu: "rouge", retardJours: 1, structureSigle: "DAF", ligneCalendrierId: 1 },
  { id: 2, intitule: "Rapport d'activité — juin 2026", nature: "Rapport mensuel d'activité", periode: "Juin 2026", echeance: "2026-07-05", depose: true, dateDepot: "2026-07-03", feu: "vert", retardJours: null, structureSigle: "DAF", ligneCalendrierId: 1 },
  { id: 3, intitule: "Rapport d'activité — mai 2026", nature: "Rapport mensuel d'activité", periode: "Mai 2026", echeance: "2026-06-05", depose: true, dateDepot: "2026-06-12", feu: "orange", retardJours: 7, structureSigle: "DAF", ligneCalendrierId: 1 },
  { id: 4, intitule: "PV de la réunion de service du 28 juillet", nature: "Procès-verbal de réunion", periode: "Juillet 2026", echeance: "2026-08-04", depose: true, dateDepot: "2026-08-01", feu: "vert", retardJours: null, structureSigle: "DAF", ligneCalendrierId: 2 },
  { id: 5, intitule: "PV de la réunion de service du 30 juin", nature: "Procès-verbal de réunion", periode: "Juin 2026", echeance: "2026-07-07", depose: true, dateDepot: "2026-07-06", feu: "vert", retardJours: null, structureSigle: "DAF", ligneCalendrierId: 2 },
  { id: 6, intitule: "Rapport sectoriel — exécution budgétaire au premier semestre", nature: "Rapport sectoriel", periode: "S1 2026", echeance: "2026-07-31", depose: true, dateDepot: "2026-07-29", feu: "vert", retardJours: null, structureSigle: "DAF", ligneCalendrierId: 3 },
  { id: 7, intitule: "Rapport d'activité — août 2026", nature: "Rapport mensuel d'activité", periode: "Août 2026", echeance: "2026-09-05", depose: false, dateDepot: null, feu: "orange", retardJours: null, structureSigle: "DAF", ligneCalendrierId: 1 },
];

/** Vue de liste : la fiche complète ne part pas dans le registre. */
export const activitesListe = (): Activite[] =>
  ACTIVITES_DEMO.map((a) => ({
    id: a.id,
    reference: a.reference,
    intitule: a.intitule,
    axe: a.axe,
    structureSigle: a.structureSigle,
    structureLibelle: a.structureLibelle,
    responsable: a.responsable,
    initiales: a.initiales,
    debut: a.debut,
    fin: a.fin,
    etat: a.etat,
    avancement: a.avancement,
    avancementAttendu: a.avancementAttendu,
    feu: a.feu,
    tachesFaites: a.tachesFaites,
    tachesTotal: a.tachesTotal,
    instructions: a.instructions,
    critique: a.critique,
  }));

/**
 * Criticité au sens du §20, recalculée après chaque écriture.
 *
 * Deux conditions, et il en faut au moins une en plus du retard : une
 * instruction du Directeur général dont le délai est passé, ou une tâche
 * échue alors que rien n'a été déclaré depuis. Le retard seul ne suffit pas —
 * sinon la moitié du plan serait critique et le mot ne trierait plus rien.
 * Une activité suspendue ou réalisée ne l'est jamais.
 */
export function recalculerCriticite(activite: ActiviteDetail, aujourdhui: string): void {
  if (activite.etat === "Suspendue" || activite.etat === "Réalisée") {
    activite.critique = false;
    return;
  }

  const enRetard = activite.avancement < activite.avancementAttendu - 10;
  const instructionEchue = activite.instructionsRattachees.some(
    (i) => !i.levee && i.echeance < aujourdhui,
  );
  const tacheEchue = activite.taches.some((t) => !t.fait && t.echeance < aujourdhui);

  activite.critique = enRetard && (instructionEchue || tacheEchue);
}
