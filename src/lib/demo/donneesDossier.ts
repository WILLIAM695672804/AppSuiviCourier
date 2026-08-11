import type { DossierDetail, ModeleCourrier } from "@/features/dossier/api";

/**
 * Jeu de démonstration de l'instruction des dossiers.
 *
 * Les cas retenus montrent les quatre situations que la fiche doit savoir
 * rendre : un dossier qui suit son cours, un dossier bloqué en attente d'un
 * complément que le demandeur n'envoie pas, un dossier retourné par le
 * validateur avec motif, et un dossier hors délai qu'aucun de ces deux
 * accidents n'explique — celui-là est le plus embarrassant.
 *
 * Les pièces portent plusieurs versions : c'est ce qui distingue un dossier
 * d'instruction d'un simple courrier. On doit pouvoir dire sur quelle version
 * la décision a été prise.
 */
export const DOSSIERS_DEMO: DossierDetail[] = [
  {
    id: 1,
    reference: "D-2026-0184",
    objet: "Autorisation d'occupation temporaire du domaine portuaire — quai 4",
    type: "Autorisation",
    demandeur: "Société Camrail",
    structure: "Service juridique",
    instructeur: "M. Diallo",
    initiales: "MD",
    ouvertLe: "2026-07-21",
    echeance: "2026-08-20",
    etape: "Instruction",
    etat: "En cours",
    criticite: "Standard",
    feu: "vert",
    joursRestants: 14,
    courrierOrigine: "0284/2026",
    courrierOrigineId: 1,
    contexte:
      "La société sollicite l'occupation de 400 m² sur le quai 4 pour l'entreposage de conteneurs, du 1er septembre au 31 décembre 2026.",
    regleAffectation:
      "Affecté au Service juridique : typologie « Autorisation » avec occupation du domaine public, en deçà du seuil de 50 millions.",
    seuil: "Moins de 50 000 000 F CFA — validation à un seul niveau",
    etapes: [
      { code: "Qualification", libelle: "Qualification et affectation", franchie: true, date: "2026-07-21", acteur: "K. Traoré" },
      { code: "Instruction", libelle: "Instruction du dossier", franchie: false, date: null, acteur: "M. Diallo" },
      { code: "Validation", libelle: "Validation hiérarchique", franchie: false, date: null, acteur: null },
      { code: "Notification", libelle: "Notification au demandeur", franchie: false, date: null, acteur: null },
      { code: "Clos", libelle: "Clôture et archivage", franchie: false, date: null, acteur: null },
    ],
    pieces: [
      {
        id: 1,
        nom: "Demande-Camrail.pdf",
        format: "PDF",
        versions: [
          { version: 1, deposeLe: "2026-07-21", deposePar: "K. Traoré", taille: "1,4 Mo", courante: true },
        ],
      },
      {
        id: 2,
        nom: "Plan-implantation.pdf",
        format: "PDF",
        versions: [
          { version: 1, deposeLe: "2026-07-24", deposePar: "Société Camrail", taille: "3,2 Mo", courante: false },
          { version: 2, deposeLe: "2026-08-01", deposePar: "Société Camrail", taille: "3,6 Mo", courante: true },
        ],
      },
    ],
    complements: [
      {
        id: 1,
        objet: "Plan d'implantation coté et attestation d'assurance en cours de validité",
        demandeLe: "2026-07-28",
        demandePar: "M. Diallo",
        echeance: "2026-08-07",
        recuLe: "2026-08-01",
      },
    ],
    historique: [
      { id: 1, type: "Ouverture", date: "2026-07-21", auteur: "K. Traoré", initiales: "KT", poste: "Agent de session courrier", texte: "Dossier ouvert à partir du courrier 0284/2026.", etapeAvant: null, etapeApres: "Qualification" },
      { id: 2, type: "Affectation", date: "2026-07-21", auteur: "Système", initiales: "SY", poste: "Affectation dynamique", texte: "Affecté au Service juridique selon la règle « Autorisation — domaine public ».", etapeAvant: "Qualification", etapeApres: "Instruction" },
      { id: 3, type: "Demande de complément", date: "2026-07-28", auteur: "M. Diallo", initiales: "MD", poste: "Gestionnaire de dossiers", texte: "Plan d'implantation coté et attestation d'assurance demandés au requérant.", etapeAvant: null, etapeApres: null },
      { id: 4, type: "Complément reçu", date: "2026-08-01", auteur: "Société Camrail", initiales: "SC", poste: "Demandeur", texte: "Plan d'implantation version 2 déposé, attestation d'assurance jointe.", etapeAvant: null, etapeApres: null },
    ],
  },
  {
    id: 2,
    reference: "D-2026-0171",
    objet: "Réclamation relative à la facturation des redevances de stationnement",
    type: "Réclamation",
    demandeur: "Entreprise Sotrans",
    structure: "DAF",
    instructeur: "M. Diallo",
    initiales: "MD",
    ouvertLe: "2026-07-09",
    echeance: "2026-08-08",
    etape: "Instruction",
    etat: "En attente de complément",
    criticite: "Standard",
    feu: "orange",
    joursRestants: 2,
    courrierOrigine: "0261/2026",
    courrierOrigineId: 2,
    contexte:
      "Le requérant conteste trois factures de redevance émises entre avril et juin, pour un montant total de 4 200 000 F CFA.",
    regleAffectation:
      "Affecté à la DAF : typologie « Réclamation » portant sur une facturation, circuit dédié prévu par RF-SUI-04.",
    seuil: null,
    etapes: [
      { code: "Qualification", libelle: "Qualification et affectation", franchie: true, date: "2026-07-09", acteur: "K. Traoré" },
      { code: "Instruction", libelle: "Instruction du dossier", franchie: false, date: null, acteur: "M. Diallo" },
      { code: "Validation", libelle: "Validation hiérarchique", franchie: false, date: null, acteur: null },
      { code: "Notification", libelle: "Notification au demandeur", franchie: false, date: null, acteur: null },
      { code: "Clos", libelle: "Clôture et archivage", franchie: false, date: null, acteur: null },
    ],
    pieces: [
      {
        id: 3,
        nom: "Reclamation-Sotrans.pdf",
        format: "PDF",
        versions: [
          { version: 1, deposeLe: "2026-07-09", deposePar: "K. Traoré", taille: "820 Ko", courante: true },
        ],
      },
    ],
    complements: [
      {
        id: 2,
        objet: "Copies des trois factures contestées et preuves de paiement",
        demandeLe: "2026-07-16",
        demandePar: "M. Diallo",
        echeance: "2026-07-31",
        // Jamais recu : l'echeance du complement est passee, celle du dossier court toujours.
        recuLe: null,
      },
    ],
    historique: [
      { id: 5, type: "Ouverture", date: "2026-07-09", auteur: "K. Traoré", initiales: "KT", poste: "Agent de session courrier", texte: "Dossier ouvert à partir du courrier 0261/2026.", etapeAvant: null, etapeApres: "Qualification" },
      { id: 6, type: "Affectation", date: "2026-07-09", auteur: "Système", initiales: "SY", poste: "Affectation dynamique", texte: "Affecté à la DAF selon la règle « Réclamation — facturation ».", etapeAvant: "Qualification", etapeApres: "Instruction" },
      { id: 7, type: "Demande de complément", date: "2026-07-16", auteur: "M. Diallo", initiales: "MD", poste: "Gestionnaire de dossiers", texte: "Factures contestées et preuves de paiement demandées. Sans elles, l'instruction ne peut pas avancer.", etapeAvant: null, etapeApres: null },
    ],
  },
  {
    id: 3,
    reference: "D-2026-0159",
    objet: "Demande de raccordement au réseau d'eau du terminal à conteneurs",
    type: "Demande",
    demandeur: "Société Maritime du Wouri",
    structure: "Direction des travaux",
    instructeur: "M. Diallo",
    initiales: "MD",
    ouvertLe: "2026-06-30",
    echeance: "2026-07-30",
    etape: "Instruction",
    etat: "Retourné",
    criticite: "Sensible",
    feu: "rouge",
    joursRestants: -7,
    courrierOrigine: null,
    courrierOrigineId: null,
    contexte:
      "Raccordement de trois postes de distribution, avec traversée d'une voie de circulation lourde.",
    regleAffectation:
      "Affecté à la Direction des travaux : typologie « Demande » avec intervention sur ouvrage, criticité sensible.",
    seuil: "Plus de 50 000 000 F CFA — validation à deux niveaux",
    etapes: [
      { code: "Qualification", libelle: "Qualification et affectation", franchie: true, date: "2026-06-30", acteur: "K. Traoré" },
      { code: "Instruction", libelle: "Instruction du dossier", franchie: false, date: null, acteur: "M. Diallo" },
      { code: "Validation", libelle: "Validation hiérarchique", franchie: false, date: null, acteur: "S. Bamba" },
      { code: "Notification", libelle: "Notification au demandeur", franchie: false, date: null, acteur: null },
      { code: "Clos", libelle: "Clôture et archivage", franchie: false, date: null, acteur: null },
    ],
    pieces: [
      {
        id: 4,
        nom: "Note-technique.pdf",
        format: "PDF",
        versions: [
          { version: 1, deposeLe: "2026-07-12", deposePar: "M. Diallo", taille: "2,4 Mo", courante: false },
          { version: 2, deposeLe: "2026-07-25", deposePar: "M. Diallo", taille: "2,9 Mo", courante: true },
        ],
      },
    ],
    complements: [],
    historique: [
      { id: 8, type: "Ouverture", date: "2026-06-30", auteur: "K. Traoré", initiales: "KT", poste: "Agent de session courrier", texte: "Dossier ouvert sur dépôt direct au guichet.", etapeAvant: null, etapeApres: "Qualification" },
      { id: 9, type: "Projet de réponse", date: "2026-07-12", auteur: "M. Diallo", initiales: "MD", poste: "Gestionnaire de dossiers", texte: "Note technique rédigée, avis favorable sous réserve de reprise de la traversée.", etapeAvant: null, etapeApres: null },
      { id: 10, type: "Retour à l'étape antérieure", date: "2026-07-20", auteur: "S. Bamba", initiales: "SB", poste: "Chef de service comptabilité", texte: "L'étude de charge sur la voie lourde n'est pas jointe. Sans elle, l'avis technique n'est pas fondé et je ne peux pas viser.", etapeAvant: "Validation", etapeApres: "Instruction" },
      { id: 11, type: "Dépôt de pièce", date: "2026-07-25", auteur: "M. Diallo", initiales: "MD", poste: "Gestionnaire de dossiers", texte: "Note technique version 2, complétée de l'étude de charge.", etapeAvant: null, etapeApres: null },
    ],
  },
  {
    id: 4,
    reference: "D-2026-0142",
    objet: "Requête en révision du classement d'un agent portuaire",
    type: "Requête",
    demandeur: "Agent — dossier RH 4218",
    structure: "DRH",
    instructeur: "L. Mbarga",
    initiales: "LM",
    ouvertLe: "2026-06-12",
    echeance: "2026-07-12",
    etape: "Instruction",
    etat: "Hors délai",
    criticite: "Sensible",
    feu: "rouge",
    joursRestants: -25,
    courrierOrigine: null,
    courrierOrigineId: null,
    contexte:
      "L'agent conteste son classement indiciaire à la suite de la réforme du barème, et sollicite un rappel sur trente mois.",
    regleAffectation: "Affecté à la DRH : typologie « Requête » portant sur la situation d'un agent.",
    seuil: null,
    etapes: [
      { code: "Qualification", libelle: "Qualification et affectation", franchie: true, date: "2026-06-12", acteur: "K. Traoré" },
      { code: "Instruction", libelle: "Instruction du dossier", franchie: false, date: null, acteur: "L. Mbarga" },
      { code: "Validation", libelle: "Validation hiérarchique", franchie: false, date: null, acteur: null },
      { code: "Notification", libelle: "Notification au demandeur", franchie: false, date: null, acteur: null },
      { code: "Clos", libelle: "Clôture et archivage", franchie: false, date: null, acteur: null },
    ],
    pieces: [
      {
        id: 5,
        nom: "Requete-agent-4218.pdf",
        format: "PDF",
        versions: [
          { version: 1, deposeLe: "2026-06-12", deposePar: "K. Traoré", taille: "640 Ko", courante: true },
        ],
      },
    ],
    complements: [],
    historique: [
      { id: 12, type: "Ouverture", date: "2026-06-12", auteur: "K. Traoré", initiales: "KT", poste: "Agent de session courrier", texte: "Dossier ouvert sur dépôt direct.", etapeAvant: null, etapeApres: "Qualification" },
      { id: 13, type: "Affectation", date: "2026-06-12", auteur: "Système", initiales: "SY", poste: "Affectation dynamique", texte: "Affecté à la DRH selon la règle « Requête — situation d'agent ».", etapeAvant: "Qualification", etapeApres: "Instruction" },
    ],
  },
  {
    id: 5,
    reference: "D-2026-0098",
    objet: "Autorisation de travaux sur le môle nord — reprise d'étanchéité",
    type: "Autorisation",
    demandeur: "Entreprise BTP Littoral",
    structure: "Direction des travaux",
    instructeur: "M. Diallo",
    initiales: "MD",
    ouvertLe: "2026-05-04",
    echeance: "2026-06-03",
    etape: "Clos",
    etat: "Clos",
    criticite: "Standard",
    feu: "vert",
    joursRestants: 0,
    courrierOrigine: "0198/2026",
    courrierOrigineId: 3,
    contexte: "Reprise de l'étanchéité sur 120 mètres linéaires, hors période de forte activité.",
    regleAffectation:
      "Affecté à la Direction des travaux : typologie « Autorisation » avec intervention sur ouvrage.",
    seuil: "Moins de 50 000 000 F CFA — validation à un seul niveau",
    etapes: [
      { code: "Qualification", libelle: "Qualification et affectation", franchie: true, date: "2026-05-04", acteur: "K. Traoré" },
      { code: "Instruction", libelle: "Instruction du dossier", franchie: true, date: "2026-05-19", acteur: "M. Diallo" },
      { code: "Validation", libelle: "Validation hiérarchique", franchie: true, date: "2026-05-26", acteur: "S. Bamba" },
      { code: "Notification", libelle: "Notification au demandeur", franchie: true, date: "2026-05-28", acteur: "K. Traoré" },
      { code: "Clos", libelle: "Clôture et archivage", franchie: true, date: "2026-06-01", acteur: "R. Fotso" },
    ],
    pieces: [
      {
        id: 6,
        nom: "Autorisation-signee.pdf",
        format: "PDF",
        versions: [
          { version: 1, deposeLe: "2026-05-28", deposePar: "K. Traoré", taille: "1,1 Mo", courante: true },
        ],
      },
    ],
    complements: [],
    historique: [
      { id: 14, type: "Ouverture", date: "2026-05-04", auteur: "K. Traoré", initiales: "KT", poste: "Agent de session courrier", texte: "Dossier ouvert à partir du courrier 0198/2026.", etapeAvant: null, etapeApres: "Qualification" },
      { id: 15, type: "Validation", date: "2026-05-26", auteur: "S. Bamba", initiales: "SB", poste: "Chef de service comptabilité", texte: "Avis favorable, autorisation accordée pour la période demandée.", etapeAvant: "Validation", etapeApres: "Notification" },
      { id: 16, type: "Notification", date: "2026-05-28", auteur: "K. Traoré", initiales: "KT", poste: "Agent de session courrier", texte: "Autorisation notifiée au demandeur par courrier recommandé.", etapeAvant: "Notification", etapeApres: "Clos" },
      { id: 17, type: "Clôture", date: "2026-06-01", auteur: "R. Fotso", initiales: "RF", poste: "Archiviste", texte: "Dossier clos et versé au système d'archivage.", etapeAvant: null, etapeApres: null },
    ],
  },
];

export const MODELES_DEMO: ModeleCourrier[] = [
  {
    id: 1,
    code: "ACC-RECEP",
    libelle: "Accusé de réception d'une demande",
    typologie: "Demande",
    description:
      "Confirme la réception au demandeur et lui indique le délai d'instruction applicable.",
    variables: ["demandeur", "reference", "objet", "delai"],
    corps:
      "Madame, Monsieur,\n\nJ'accuse réception de votre demande enregistrée sous la référence {{reference}}, relative à : {{objet}}.\n\nCelle-ci fait l'objet d'une instruction dont le délai est fixé à {{delai}} jours ouvrés à compter de ce jour. Vous serez informé de la suite qui lui sera réservée.\n\nJe vous prie d'agréer, Madame, Monsieur, l'expression de ma considération distinguée.",
    misAJourLe: "2026-03-12",
    misAJourPar: "A. Kouassi",
    utilisations: 428,
  },
  {
    id: 2,
    code: "DEM-COMP",
    libelle: "Demande de pièces complémentaires",
    typologie: "Tous types",
    description:
      "Sollicite du demandeur les pièces manquantes, avec mention du délai de production.",
    variables: ["demandeur", "reference", "pieces", "echeance"],
    corps:
      "Madame, Monsieur,\n\nL'instruction de votre dossier {{reference}} ne peut se poursuivre en l'état.\n\nJe vous saurais gré de bien vouloir produire les pièces suivantes : {{pieces}}.\n\nCes éléments sont attendus pour le {{echeance}} au plus tard. À défaut, le dossier sera clos sans suite.\n\nJe vous prie d'agréer, Madame, Monsieur, l'expression de ma considération distinguée.",
    misAJourLe: "2026-03-12",
    misAJourPar: "A. Kouassi",
    utilisations: 216,
  },
  {
    id: 3,
    code: "AUT-ACC",
    libelle: "Notification d'autorisation accordée",
    typologie: "Autorisation",
    description: "Notifie l'accord, ses conditions et sa période de validité.",
    variables: ["demandeur", "reference", "objet", "debut", "fin", "conditions"],
    corps:
      "Madame, Monsieur,\n\nPar la présente, je vous informe qu'il est fait droit à votre demande {{reference}} relative à : {{objet}}.\n\nCette autorisation est accordée du {{debut}} au {{fin}}, sous les conditions suivantes : {{conditions}}.\n\nTout manquement à ces conditions entraînera le retrait de l'autorisation.\n\nJe vous prie d'agréer, Madame, Monsieur, l'expression de ma considération distinguée.",
    misAJourLe: "2026-05-04",
    misAJourPar: "A. Kouassi",
    utilisations: 94,
  },
  {
    id: 4,
    code: "REJ-MOT",
    libelle: "Notification de rejet motivé",
    typologie: "Tous types",
    description:
      "Notifie le rejet, ses motifs et les voies de recours — mentions obligatoires comprises.",
    variables: ["demandeur", "reference", "objet", "motifs", "delaiRecours"],
    corps:
      "Madame, Monsieur,\n\nAprès instruction, votre demande {{reference}} relative à : {{objet}}, ne peut recevoir une suite favorable.\n\nCette décision est motivée par les éléments suivants : {{motifs}}.\n\nVous disposez d'un délai de {{delaiRecours}} pour former un recours gracieux devant l'autorité signataire, ou un recours contentieux devant la juridiction compétente.\n\nJe vous prie d'agréer, Madame, Monsieur, l'expression de ma considération distinguée.",
    misAJourLe: "2026-05-04",
    misAJourPar: "A. Kouassi",
    utilisations: 37,
  },
  {
    id: 5,
    code: "REC-SUITE",
    libelle: "Réponse à une réclamation",
    typologie: "Réclamation",
    description: "Répond à une réclamation en exposant les constats et la suite donnée.",
    variables: ["demandeur", "reference", "constats", "suite"],
    corps:
      "Madame, Monsieur,\n\nVotre réclamation {{reference}} a retenu toute mon attention.\n\nLes vérifications conduites établissent ce qui suit : {{constats}}.\n\nEn conséquence, {{suite}}.\n\nJe vous prie d'agréer, Madame, Monsieur, l'expression de ma considération distinguée.",
    misAJourLe: "2026-06-18",
    misAJourPar: "A. Kouassi",
    utilisations: 63,
  },
];
