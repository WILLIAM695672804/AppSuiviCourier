import type { RegleConservation, VersementDetail } from "@/features/archivage/api";

/**
 * Jeu de démonstration de l'archivage.
 *
 * Les cas retenus montrent ce qu'un archiviste doit voir en priorité : une
 * règle jamais validée par le service des archives — donc inopposable —, un
 * dossier dont la durée d'utilité administrative est dépassée sans que le sort
 * final ait été appliqué, et un versement bloqué par une pièce manquante.
 *
 * Les empreintes sont fictives mais respectent la forme d'un SHA-256 : le jour
 * où le serveur les calculera vraiment, aucun écran ne changera.
 */
export const REGLES_DEMO: RegleConservation[] = [
  {
    id: 1,
    typologie: "Courrier d'administration générale",
    description: "Correspondance courante n'engageant pas la responsabilité de l'institution.",
    dua: 5,
    sortFinal: "Destruction",
    fondementJuridique: "Instruction sur le tri et la conservation des archives publiques, art. 12",
    valideePar: "R. Fotso, archiviste",
    valideeLe: "2026-02-14",
    actif: true,
    dossiersConcernes: 1842,
  },
  {
    id: 2,
    typologie: "Délibération du Conseil d'administration",
    description: "Procès-verbaux et délibérations des organes de gouvernance.",
    dua: 10,
    sortFinal: "Conservation définitive",
    fondementJuridique: "Code du patrimoine, archives publiques à valeur historique",
    valideePar: "R. Fotso, archiviste",
    valideeLe: "2026-02-14",
    actif: true,
    dossiersConcernes: 214,
  },
  {
    id: 3,
    typologie: "Marché public et contrat",
    description: "Dossiers de consultation, contrats et pièces d'exécution financière.",
    dua: 10,
    sortFinal: "Tri",
    fondementJuridique: "Réglementation des marchés publics, obligation décennale",
    valideePar: "R. Fotso, archiviste",
    valideeLe: "2026-03-02",
    actif: true,
    dossiersConcernes: 486,
  },
  {
    id: 4,
    typologie: "Dossier contentieux",
    description: "Pièces produites ou reçues dans le cadre d'un litige.",
    dua: 30,
    sortFinal: "Conservation définitive",
    fondementJuridique: "Prescription trentenaire applicable aux actions réelles",
    valideePar: "R. Fotso, archiviste",
    valideeLe: "2026-03-02",
    actif: true,
    dossiersConcernes: 57,
  },
  {
    id: 5,
    typologie: "Réclamation d'usager",
    description: "Demandes et réclamations reçues du public, et leurs réponses.",
    dua: 3,
    sortFinal: "Tri",
    fondementJuridique: "À confirmer avec la direction des affaires juridiques",
    // Jamais validee : la regle existe mais n'est opposable a personne.
    valideePar: null,
    valideeLe: null,
    actif: true,
    dossiersConcernes: 623,
  },
  {
    id: 6,
    typologie: "Note de service",
    description: "Instructions internes de portée générale.",
    dua: 5,
    sortFinal: "Tri",
    fondementJuridique: "Instruction sur le tri et la conservation des archives publiques, art. 9",
    valideePar: "R. Fotso, archiviste",
    valideeLe: "2026-02-14",
    actif: false,
    dossiersConcernes: 0,
  },
];

export const VERSEMENTS_DEMO: VersementDetail[] = [
  {
    id: 1,
    reference: "0142/2021",
    objet: "Marché de fourniture d'équipements de manutention — lot 2",
    typologie: "Marché public et contrat",
    structure: "DAF",
    closLe: "2021-06-18",
    dua: 10,
    sortFinal: "Tri",
    echeanceSortFinal: "2031-06-18",
    etat: "À verser",
    pieces: 14,
    piecesAttendues: 14,
    feu: "vert",
    fondementJuridique: "Réglementation des marchés publics, obligation décennale",
    verseLe: null,
    versePar: null,
    anomalies: [],
    piecesJointes: [
      {
        id: 1,
        nom: "Dossier-de-consultation.pdf",
        format: "PDF",
        taille: "3,4 Mo",
        presente: true,
      },
      { id: 2, nom: "Contrat-signe.pdf", format: "PDF", taille: "1,8 Mo", presente: true },
      { id: 3, nom: "PV-de-reception.pdf", format: "PDF", taille: "620 Ko", presente: true },
    ],
    chaineIntegrite: [
      {
        etape: "Clôture du dossier",
        horodatage: "2021-06-18T16:42:00",
        empreinte: "a3f1c9e8d2b7460f8c15e3a7b942d0165fc8e3a1b7d492f06c8a3e51d7b09f24",
      },
      {
        etape: "Contrôle de conformité",
        horodatage: "2026-08-04T09:12:00",
        empreinte: "7b2e94a1c6f03d85b1e7a94c2d608f31a5c9e042b8d7136f9a04e2c85b1d7639",
      },
    ],
  },
  {
    id: 2,
    reference: "0087/2016",
    objet: "Correspondance générale — exercice 2016",
    typologie: "Courrier d'administration générale",
    structure: "SCC",
    closLe: "2016-12-31",
    dua: 5,
    sortFinal: "Destruction",
    // DUA expiree depuis longtemps : le sort final aurait du etre applique.
    echeanceSortFinal: "2021-12-31",
    etat: "À verser",
    pieces: 208,
    piecesAttendues: 208,
    feu: "rouge",
    fondementJuridique: "Instruction sur le tri et la conservation des archives publiques, art. 12",
    verseLe: null,
    versePar: null,
    anomalies: [
      {
        libelle: "Durée d'utilité administrative dépassée",
        precision:
          "L'échéance était fixée au 31 décembre 2021. Le dossier aurait dû faire l'objet d'une proposition d'élimination il y a plus de quatre ans.",
        bloquante: false,
      },
    ],
    piecesJointes: [
      { id: 4, nom: "Registre-2016-scan.pdf", format: "PDF", taille: "42 Mo", presente: true },
    ],
    chaineIntegrite: [
      {
        etape: "Clôture du dossier",
        horodatage: "2016-12-31T17:00:00",
        empreinte: "e1c74b90a2d635f8c47b1e93a05d28f6b3c9017e5a4d82f61c073b9e2a5d84f1",
      },
    ],
  },
  {
    id: 3,
    reference: "0311/2023",
    objet: "Contentieux relatif à l'occupation du domaine portuaire",
    typologie: "Dossier contentieux",
    structure: "Service juridique",
    closLe: "2023-11-09",
    dua: 30,
    sortFinal: "Conservation définitive",
    echeanceSortFinal: "2053-11-09",
    etat: "Anomalie",
    pieces: 9,
    piecesAttendues: 12,
    feu: "rouge",
    fondementJuridique: "Prescription trentenaire applicable aux actions réelles",
    verseLe: null,
    versePar: null,
    anomalies: [
      {
        libelle: "Trois pièces manquantes",
        precision:
          "Les conclusions en défense, le jugement et l'accusé de signification sont absents du dossier numérique. Un dossier contentieux incomplet n'a pas de valeur probante.",
        bloquante: true,
      },
    ],
    piecesJointes: [
      { id: 5, nom: "Requete-introductive.pdf", format: "PDF", taille: "2,1 Mo", presente: true },
      { id: 6, nom: "Memoire-en-defense.pdf", format: "PDF", taille: "—", presente: false },
      { id: 7, nom: "Jugement.pdf", format: "PDF", taille: "—", presente: false },
      { id: 8, nom: "Accuse-de-signification.pdf", format: "PDF", taille: "—", presente: false },
    ],
    chaineIntegrite: [
      {
        etape: "Clôture du dossier",
        horodatage: "2023-11-09T11:28:00",
        empreinte: "c8a04f2e7b91d356e0a8c4d17b23d95f6e1a70c48b39d2f5a6e0c81b74d3925a",
      },
    ],
  },
  {
    id: 4,
    reference: "CA-2024-S01",
    objet: "Procès-verbaux du Conseil d'administration — exercice 2024",
    typologie: "Délibération du Conseil d'administration",
    structure: "DSR",
    closLe: "2024-12-20",
    dua: 10,
    sortFinal: "Conservation définitive",
    echeanceSortFinal: "2034-12-20",
    etat: "Versé",
    pieces: 6,
    piecesAttendues: 6,
    feu: "vert",
    fondementJuridique: "Code du patrimoine, archives publiques à valeur historique",
    verseLe: "2026-07-15",
    versePar: "R. Fotso",
    anomalies: [],
    piecesJointes: [
      { id: 9, nom: "PV-session-1.pdf", format: "PDF", taille: "1,2 Mo", presente: true },
      { id: 10, nom: "PV-session-2.pdf", format: "PDF", taille: "1,4 Mo", presente: true },
    ],
    chaineIntegrite: [
      {
        etape: "Clôture du dossier",
        horodatage: "2024-12-20T15:05:00",
        empreinte: "b57e0d3a9c2184f61e7b0a35d92c8f4e1a60b7d38c9e52f0a1b4d76c83e9052f",
      },
      {
        etape: "Contrôle de conformité",
        horodatage: "2026-07-14T10:33:00",
        empreinte: "f0d92a7e4b18c63d5a09e2b74f81c360a9d7e52b8c41f0369a2d5e07b8c14f93",
      },
      {
        etape: "Versement au système d'archivage",
        horodatage: "2026-07-15T08:20:00",
        empreinte: "3a9c15e70b842d6f9e01c73a5b8d24f60c9e17a35d82b04f7e61a9c25d3b087e",
      },
    ],
  },
  {
    id: 5,
    reference: "0455/2022",
    objet: "Réclamations d'usagers — second semestre 2022",
    typologie: "Réclamation d'usager",
    structure: "DAF",
    closLe: "2022-12-31",
    dua: 3,
    sortFinal: "Tri",
    echeanceSortFinal: "2025-12-31",
    etat: "À verser",
    pieces: 47,
    piecesAttendues: 47,
    feu: "orange",
    fondementJuridique: "À confirmer avec la direction des affaires juridiques",
    verseLe: null,
    versePar: null,
    anomalies: [
      {
        libelle: "Règle de conservation non validée",
        precision:
          "La typologie « Réclamation d'usager » n'a pas reçu le visa du service des archives. Le sort final proposé n'est opposable à personne tant que la règle n'est pas validée.",
        bloquante: true,
      },
    ],
    piecesJointes: [
      { id: 11, nom: "Reclamations-S2-2022.pdf", format: "PDF", taille: "8,7 Mo", presente: true },
    ],
    chaineIntegrite: [
      {
        etape: "Clôture du dossier",
        horodatage: "2022-12-31T16:00:00",
        empreinte: "d4b81f0e9a20a297e35d6f81b04a9c72e5308df1a6b9c24e70f83a5d1c96b2e0",
      },
    ],
  },
];
