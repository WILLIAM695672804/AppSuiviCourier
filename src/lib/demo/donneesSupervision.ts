import type { Incident, Integration, PerformanceEcran, ServicePlateforme } from "@/features/supervision/api";

/**
 * Jeu de démonstration de l'exploitation technique.
 *
 * Les cas sont choisis pour que l'écran ait quelque chose à dire : un service
 * dégradé, un incident majeur clos hors du délai de reprise contractuel, un
 * écran dont le 95ᵉ centile dépasse les deux secondes du BRD, et un connecteur
 * qui n'a jamais été branché.
 */

export const SERVICES_DEMO: ServicePlateforme[] = [
  {
    nom: "Application web",
    role: "Interface des agents",
    etat: "Opérationnel",
    disponibilite: 99.8,
    tempsReponseMs: 210,
    feu: "vert",
  },
  {
    nom: "Interface de programmation",
    role: "Service des données à l'application",
    etat: "Opérationnel",
    disponibilite: 99.6,
    tempsReponseMs: 340,
    feu: "vert",
  },
  {
    nom: "Base de données",
    role: "Stockage transactionnel",
    etat: "Opérationnel",
    disponibilite: 99.9,
    tempsReponseMs: 40,
    feu: "vert",
  },
  {
    nom: "Entrepôt décisionnel",
    role: "Calcul des indicateurs et du scoring",
    etat: "Dégradé",
    // Sous la cible contractuelle de 99,5 %.
    disponibilite: 97.2,
    tempsReponseMs: 1840,
    feu: "orange",
  },
  {
    nom: "Service de numérisation",
    role: "Capture et reconnaissance de caractères",
    etat: "Opérationnel",
    disponibilite: 99.5,
    tempsReponseMs: 2600,
    feu: "vert",
  },
  {
    nom: "Archivage électronique",
    role: "Versement et scellement des dossiers clos",
    etat: "Opérationnel",
    disponibilite: 99.7,
    tempsReponseMs: 520,
    feu: "vert",
  },
];

export const INCIDENTS_DEMO: Incident[] = [
  {
    id: 1,
    debut: "2026-08-04T14:22:00",
    fin: null,
    gravite: "Mineur",
    service: "Entrepôt décisionnel",
    resume: "Recalcul du scoring plus lent que prévu depuis l'ajout des dossiers",
    impact:
      "La matrice de scoring et les tableaux de bord de structure mettent jusqu'à trois secondes à s'afficher.",
    resolution: null,
    dureeMinutes: null,
  },
  {
    id: 2,
    debut: "2026-07-28T08:05:00",
    fin: "2026-07-28T13:40:00",
    gravite: "Majeur",
    service: "Interface de programmation",
    resume: "Saturation du pool de connexions à la base",
    impact:
      "Application inaccessible pendant 5 h 35 en heures ouvrées, sur l'ensemble des postes.",
    resolution:
      "Pool porté de 40 à 120 connexions, et requête de registre corrigée. Reprise en 335 minutes, au-delà des 240 minutes de l'engagement de reprise.",
    // 335 minutes : au-dela du RTO contractuel de 4 heures.
    dureeMinutes: 335,
  },
  {
    id: 3,
    debut: "2026-07-11T22:10:00",
    fin: "2026-07-11T23:05:00",
    gravite: "Mineur",
    service: "Service de numérisation",
    resume: "File de reconnaissance de caractères bloquée sur un document corrompu",
    impact: "Quarante documents en attente de traitement, rattrapés dans la nuit.",
    resolution: "Document écarté, contrôle de format ajouté à l'entrée de la file.",
    dureeMinutes: 55,
  },
  {
    id: 4,
    debut: "2026-06-30T02:00:00",
    fin: "2026-06-30T04:30:00",
    gravite: "Information",
    service: "Base de données",
    resume: "Fenêtre de maintenance planifiée — montée de version mineure",
    impact: "Aucune : intervention hors heures ouvrées, annoncée sept jours à l'avance.",
    resolution: "Montée de version effectuée, sauvegarde vérifiée avant et après.",
    dureeMinutes: 150,
  },
];

export const PERFORMANCES_DEMO: PerformanceEcran[] = [
  { ecran: "Registre des courriers", appels24h: 4820, p50Ms: 180, p95Ms: 640, feu: "vert" },
  { ecran: "Fiche d'un courrier", appels24h: 3140, p50Ms: 140, p95Ms: 480, feu: "vert" },
  { ecran: "Tableau de bord du courrier", appels24h: 1260, p50Ms: 320, p95Ms: 1120, feu: "vert" },
  { ecran: "Cockpit exécutif", appels24h: 86, p50Ms: 640, p95Ms: 1980, feu: "orange" },
  // Au-dela des 2 secondes exigees pour 95 % des transactions (RNF-PERF-01).
  { ecran: "Matrice de scoring", appels24h: 214, p50Ms: 890, p95Ms: 3240, feu: "rouge" },
  { ecran: "Tableau de bord de structure", appels24h: 940, p50Ms: 410, p95Ms: 2380, feu: "rouge" },
  { ecran: "Registre des dossiers", appels24h: 1180, p50Ms: 200, p95Ms: 720, feu: "vert" },
  { ecran: "Recherche transversale", appels24h: 620, p50Ms: 540, p95Ms: 1760, feu: "vert" },
];

export const INTEGRATIONS_DEMO: Integration[] = [
  {
    id: 1,
    systeme: "Annuaire d'entreprise",
    type: "Annuaire",
    protocole: "LDAP over TLS",
    etat: "Connecté",
    derniereSynchronisation: "2026-08-06T06:00:00",
    latenceMs: 120,
    volumeDernierPassage: 1284,
    erreurs24h: 0,
    feu: "vert",
    note: null,
  },
  {
    id: 2,
    systeme: "Messagerie institutionnelle",
    type: "Messagerie",
    protocole: "SMTP + IMAP",
    etat: "Connecté",
    derniereSynchronisation: "2026-08-06T09:45:00",
    latenceMs: 340,
    volumeDernierPassage: 62,
    erreurs24h: 3,
    feu: "orange",
    note: "Trois messages rejetés pour pièce jointe au-delà de 25 Mo.",
  },
  {
    id: 3,
    systeme: "Système financier",
    type: "Système financier",
    protocole: "API REST",
    etat: "Dégradé",
    derniereSynchronisation: "2026-08-05T18:20:00",
    latenceMs: 4200,
    volumeDernierPassage: 418,
    erreurs24h: 27,
    feu: "rouge",
    note: "Délai de réponse au-delà de quatre secondes depuis la migration du 3 août. Signalé à l'éditeur.",
  },
  {
    id: 4,
    systeme: "Progiciel de gestion intégré",
    type: "ERP",
    protocole: "À définir",
    etat: "En construction",
    derniereSynchronisation: null,
    latenceMs: null,
    volumeDernierPassage: null,
    erreurs24h: 0,
    feu: "inconnu",
    note: "Le progiciel est en cours de déploiement. Le connecteur est prévu par RF-ADM-02 mais n'a pas d'interlocuteur technique à ce jour.",
  },
  {
    id: 5,
    systeme: "Portail des usagers",
    type: "Portail usagers",
    protocole: "API REST",
    etat: "Non connecté",
    derniereSynchronisation: null,
    latenceMs: null,
    volumeDernierPassage: null,
    erreurs24h: 0,
    feu: "orange",
    note: "Le portail externe n'est pas déployé. Le dépôt et le suivi de demande par les usagers restent impossibles.",
  },
];
