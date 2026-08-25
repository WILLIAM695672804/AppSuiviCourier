/**
 * Glossaire des sigles et acronymes.
 *
 * Le descriptif fonctionnel le demande deux fois : au §3.12, pour l'auditeur
 * qui « s'appuie sur le glossaire des acronymes intégré à l'interface pour la
 * lisibilité des restitutions », et en note finale — « Prévoir au début du
 * document un glossaire pour les abréviations ».
 *
 * Il vit dans `lib` et non dans une fonctionnalité : les sigles traversent
 * tous les écrans, et un glossaire enfermé dans un domaine serait inaccessible
 * depuis les autres.
 *
 * Trois familles s'y mêlent, et c'est voulu. Les sigles de l'institution
 * (DSR, CODIR), ceux du programme (GED, BPM), et ceux du métier administratif
 * (DUA, PAA). Un auditeur qui ouvre une restitution ne sait pas d'avance
 * auquel des trois registres appartient le sigle qui l'arrête.
 */
export interface EntreeGlossaire {
  sigle: string;
  intitule: string;
  definition: string;
  famille: "Institution" | "Programme" | "Métier";
}

export const GLOSSAIRE: EntreeGlossaire[] = [
  // ---- Institution
  {
    sigle: "PAD",
    intitule: "Port Autonome de Douala",
    definition: "L'institution elle-même, maître d'ouvrage de la plateforme.",
    famille: "Institution",
  },
  {
    sigle: "DSR",
    intitule: "Division du Suivi et de la Relance",
    definition:
      "Structure pivot du dispositif : secrétariat des instances, consolidation des remontées, relance des structures en retard.",
    famille: "Institution",
  },
  {
    sigle: "CODIR",
    intitule: "Comité de Direction",
    definition:
      "Conseil des directeurs — instance de pilotage tactique où siègent les directeurs de l'institution. Ses décisions sont suivies au registre des décisions.",
    famille: "Institution",
  },
  {
    sigle: "CA",
    intitule: "Conseil d'Administration",
    definition:
      "Instance délibérante. Ses résolutions engagent les structures jusqu'à leur exécution complète.",
    famille: "Institution",
  },
  {
    sigle: "AG",
    intitule: "Assemblée Générale",
    definition: "Instance des filiales et succursales, dont la DSR suit la préparation.",
    famille: "Institution",
  },
  {
    sigle: "DG",
    intitule: "Direction Générale",
    definition: "Autorité d'arbitrage, destinataire du cockpit exécutif.",
    famille: "Institution",
  },
  {
    sigle: "DAF",
    intitule: "Direction des Affaires Financières",
    definition: "Direction chargée du budget, de la comptabilité et des marchés.",
    famille: "Institution",
  },
  {
    sigle: "DCG",
    intitule: "Direction du Contrôle de Gestion",
    definition:
      "Valide les plans d'actions annuels et suit les indicateurs cibles du programme.",
    famille: "Institution",
  },
  {
    sigle: "DSI",
    intitule: "Direction des Systèmes d'Information",
    definition: "Exploitation technique de la plateforme et intégrations.",
    famille: "Institution",
  },
  {
    sigle: "SCC",
    intitule: "Service du Courrier Central",
    definition:
      "Bureau d'ordre : enregistre, numérise, indexe et transmet le courrier arrivé.",
    famille: "Institution",
  },
  {
    sigle: "CDA",
    intitule: "Centre de la Documentation et des Archives",
    definition: "Valide le référentiel de conservation et reçoit les versements.",
    famille: "Institution",
  },
  {
    sigle: "CCO",
    intitule: "Comité Consultatif d'Orientation",
    definition:
      "Regroupement externe auprès duquel le PAD est représenté ; ses avis sont suivis comme des décisions.",
    famille: "Institution",
  },
  {
    sigle: "CONAFE",
    intitule: "Comité National de Facilitation des Échanges",
    definition: "Instance nationale de facilitation du commerce, où siège un représentant du PAD.",
    famille: "Institution",
  },

  // ---- Programme
  {
    sigle: "GED",
    intitule: "Gestion Électronique des Documents",
    definition: "Capture, indexation, versionnement et recherche des documents.",
    famille: "Programme",
  },
  {
    sigle: "BPM",
    intitule: "Business Process Management",
    definition:
      "Gestion des processus métiers : circuits de validation, délais par étape, règles d'escalade.",
    famille: "Programme",
  },
  {
    sigle: "BI",
    intitule: "Business Intelligence",
    definition: "Informatique décisionnelle : entrepôt consolidé et tableaux de bord.",
    famille: "Programme",
  },
  {
    sigle: "SAE",
    intitule: "Système d'Archivage Électronique",
    definition: "Destination des dossiers clos, après contrôle de conformité et versement.",
    famille: "Programme",
  },
  {
    sigle: "SLA",
    intitule: "Service Level Agreement",
    definition:
      "Engagement de niveau de service : délai contractuel attaché à une étape du circuit.",
    famille: "Programme",
  },
  {
    sigle: "RBAC",
    intitule: "Role-Based Access Control",
    definition:
      "Contrôle d'accès par rôles : chacun ne voit et ne saisit que ce qui relève de son périmètre.",
    famille: "Programme",
  },
  {
    sigle: "SSO",
    intitule: "Single Sign-On",
    definition:
      "Authentification unique par l'annuaire d'entreprise, sans mot de passe propre à l'application.",
    famille: "Programme",
  },
  {
    sigle: "MOA / MOE",
    intitule: "Maîtrise d'Ouvrage / Maîtrise d'Œuvre",
    definition: "Le commanditaire et le réalisateur du programme.",
    famille: "Programme",
  },
  {
    sigle: "MoSCoW",
    intitule: "Must, Should, Could, Won't",
    definition: "Méthode de priorisation des exigences employée dans le document de référence.",
    famille: "Programme",
  },
  {
    sigle: "PRA / PCA",
    intitule: "Plan de Reprise / de Continuité d'Activité",
    definition:
      "Dispositif de retour au service après sinistre. Engagement de reprise : moins de quatre heures.",
    famille: "Programme",
  },
  {
    sigle: "OCR",
    intitule: "Optical Character Recognition",
    definition:
      "Reconnaissance optique de caractères : extrait le texte d'un document numérisé.",
    famille: "Programme",
  },
  {
    sigle: "RTO",
    intitule: "Recovery Time Objective",
    definition: "Durée maximale d'interruption admise avant retour au service.",
    famille: "Programme",
  },

  // ---- Métier
  {
    sigle: "PAA",
    intitule: "Plan d'Actions Annuel",
    definition:
      "Programme d'activités d'une structure pour l'exercice, validé par le contrôle de gestion.",
    famille: "Métier",
  },
  {
    sigle: "DUA",
    intitule: "Durée d'Utilité Administrative",
    definition:
      "Temps pendant lequel un dossier clos reste utile au service. À son terme s'applique le sort final.",
    famille: "Métier",
  },
  {
    sigle: "Sort final",
    intitule: "Sort final d'un dossier",
    definition:
      "Ce que devient le dossier une fois la DUA écoulée : conservation définitive, destruction, ou tri.",
    famille: "Métier",
  },
  {
    sigle: "Chef de file",
    intitule: "Structure chef de file",
    definition:
      "Première structure cotée sur un courrier. Elle coordonne le traitement et centralise la réponse.",
    famille: "Métier",
  },
  {
    sigle: "Structure pilote",
    intitule: "Structure pilote d'une décision",
    definition:
      "Structure qui rend compte pour l'ensemble : c'est elle que la relance atteint, elle qui déclare l'exécution.",
    famille: "Métier",
  },
  {
    sigle: "Cotation",
    intitule: "Cotation d'un courrier",
    definition:
      "Décision d'orienter un courrier vers une ou plusieurs structures, avec mention et délai. À ne pas confondre avec l'affectation, qui désigne un agent.",
    famille: "Métier",
  },
  {
    sigle: "Bordereau",
    intitule: "Bordereau de transmission",
    definition:
      "Pièce accompagnant la remise physique d'un lot de courriers, signée par le récepteur.",
    famille: "Métier",
  },
  {
    sigle: "Point focal",
    intitule: "Point focal de structure",
    definition:
      "Agent désigné pour alimenter les données de sa structure : activités, rapports, disponibilité.",
    famille: "Métier",
  },
  {
    sigle: "Périmètre",
    intitule: "Périmètre de visibilité",
    definition:
      "Étendue des données accessibles : poste, structure, structure et descendants, ou institution.",
    famille: "Métier",
  },
];

/** Recherche insensible à la casse et aux accents, sur le sigle et l'intitulé. */
export function chercherGlossaire(terme: string): EntreeGlossaire[] {
  const recherche = terme
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  if (!recherche) return GLOSSAIRE;

  return GLOSSAIRE.filter((entree) =>
    `${entree.sigle} ${entree.intitule} ${entree.definition}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .includes(recherche),
  );
}
