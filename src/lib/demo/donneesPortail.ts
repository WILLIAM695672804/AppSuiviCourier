import type { DemandeUsagerDetail, Echange, Preferences } from "@/features/portail/api";

/**
 * Jeu de démonstration du portail externe.
 *
 * Toutes ces données appartiennent au même déposant — la société Camrail, qui
 * est le compte `usager`. C'est volontaire et c'est le point à vérifier :
 * aucune requête du portail ne doit pouvoir renvoyer autre chose.
 *
 * Les trois situations qu'un usager rencontre sont représentées : une demande
 * qui suit son cours, une demande bloquée parce qu'on attend quelque chose de
 * lui — c'est celle qui doit sauter aux yeux —, et une demande close.
 */
export const DEMANDES_PORTAIL_DEMO: DemandeUsagerDetail[] = [
  {
    id: 1,
    reference: "D-2026-0184",
    objet: "Autorisation d'occupation temporaire du quai 4",
    type: "Autorisation",
    deposeeLe: "2026-07-21",
    reponseAttendueLe: "2026-08-20",
    etat: "À l'étude",
    actionAttendue: false,
    serviceInstructeur: "Service juridique",
    contexte:
      "Occupation de 400 m² sur le quai 4 pour l'entreposage de conteneurs, du 1er septembre au 31 décembre 2026.",
    complementAttendu: null,
    etapes: [
      {
        libelle: "Demande reçue",
        franchie: true,
        date: "2026-07-21",
        explication: "Votre demande a été enregistrée et transmise au service compétent.",
      },
      {
        libelle: "À l'étude",
        franchie: false,
        date: null,
        explication:
          "Le service juridique examine votre dossier. Vous serez averti si une pièce complémentaire est nécessaire.",
      },
      {
        libelle: "Décision",
        franchie: false,
        date: null,
        explication: "La décision vous sera notifiée par le canal que vous avez choisi.",
      },
      {
        libelle: "Dossier clos",
        franchie: false,
        date: null,
        explication: "Votre dossier est archivé. Vous pourrez toujours le consulter ici.",
      },
    ],
    messages: [
      {
        id: 1,
        auteur: "Institution",
        nom: "Service juridique",
        date: "2026-07-28",
        texte:
          "Bonjour. Nous avons besoin du plan d'implantation coté et de votre attestation d'assurance en cours de validité pour poursuivre l'examen.",
        pieces: [],
      },
      {
        id: 2,
        auteur: "Vous",
        nom: "Société Camrail",
        date: "2026-08-01",
        texte: "Bonjour, veuillez trouver ci-joint le plan coté et l'attestation demandée.",
        pieces: [
          { nom: "Plan-implantation-v2.pdf", taille: "3,6 Mo" },
          { nom: "Attestation-assurance.pdf", taille: "480 Ko" },
        ],
      },
      {
        id: 3,
        auteur: "Institution",
        nom: "Service juridique",
        date: "2026-08-02",
        texte: "Pièces bien reçues, merci. L'instruction se poursuit.",
        pieces: [],
      },
    ],
    pieces: [
      { id: 1, nom: "Demande-Camrail.pdf", taille: "1,4 Mo", deposeeLe: "2026-07-21", parVous: true },
      { id: 2, nom: "Plan-implantation-v2.pdf", taille: "3,6 Mo", deposeeLe: "2026-08-01", parVous: true },
      { id: 3, nom: "Attestation-assurance.pdf", taille: "480 Ko", deposeeLe: "2026-08-01", parVous: true },
    ],
  },
  {
    id: 2,
    reference: "D-2026-0203",
    objet: "Renouvellement du badge d'accès des conducteurs",
    type: "Demande",
    deposeeLe: "2026-08-01",
    reponseAttendueLe: "2026-08-16",
    etat: "Complément attendu",
    // C'est la demande qui doit sauter aux yeux : l'usager bloque le dossier.
    actionAttendue: true,
    serviceInstructeur: "Direction de l'exploitation",
    contexte: "Renouvellement de dix-huit badges d'accès arrivant à échéance le 31 août.",
    complementAttendu: {
      objet:
        "Liste nominative des conducteurs avec copie de leur permis en cours de validité, et attestation de formation à la sécurité portuaire.",
      avantLe: "2026-08-12",
    },
    etapes: [
      {
        libelle: "Demande reçue",
        franchie: true,
        date: "2026-08-01",
        explication: "Votre demande a été enregistrée et transmise au service compétent.",
      },
      {
        libelle: "Complément attendu",
        franchie: false,
        date: null,
        explication:
          "Nous attendons des pièces de votre part. Le dossier ne peut pas avancer sans elles.",
      },
      { libelle: "Décision", franchie: false, date: null, explication: "La décision vous sera notifiée." },
      { libelle: "Dossier clos", franchie: false, date: null, explication: "Votre dossier sera archivé." },
    ],
    messages: [
      {
        id: 4,
        auteur: "Institution",
        nom: "Direction de l'exploitation",
        date: "2026-08-04",
        texte:
          "Bonjour. Merci de nous transmettre la liste nominative des conducteurs concernés, avec copie de leur permis et l'attestation de formation à la sécurité portuaire. Sans ces pièces, les badges ne peuvent pas être renouvelés avant le 31 août.",
        pieces: [],
      },
    ],
    pieces: [
      { id: 4, nom: "Demande-badges.pdf", taille: "620 Ko", deposeeLe: "2026-08-01", parVous: true },
    ],
  },
  {
    id: 3,
    reference: "D-2026-0098",
    objet: "Autorisation de travaux sur le môle nord",
    type: "Autorisation",
    deposeeLe: "2026-05-04",
    reponseAttendueLe: "2026-06-03",
    etat: "Close",
    actionAttendue: false,
    serviceInstructeur: "Direction des travaux",
    contexte: "Reprise de l'étanchéité sur 120 mètres linéaires, hors période de forte activité.",
    complementAttendu: null,
    etapes: [
      { libelle: "Demande reçue", franchie: true, date: "2026-05-04", explication: "Votre demande a été enregistrée." },
      { libelle: "À l'étude", franchie: true, date: "2026-05-19", explication: "Le service a examiné votre dossier." },
      {
        libelle: "Décision",
        franchie: true,
        date: "2026-05-28",
        explication: "Votre demande a reçu une suite favorable. La décision figure dans vos pièces.",
      },
      { libelle: "Dossier clos", franchie: true, date: "2026-06-01", explication: "Votre dossier est archivé." },
    ],
    messages: [
      {
        id: 5,
        auteur: "Institution",
        nom: "Direction des travaux",
        date: "2026-05-28",
        texte:
          "Votre demande est acceptée pour la période sollicitée. L'autorisation signée est jointe. Les conditions d'intervention y figurent en annexe.",
        pieces: [{ nom: "Autorisation-signee.pdf", taille: "1,1 Mo" }],
      },
    ],
    pieces: [
      { id: 5, nom: "Demande-travaux.pdf", taille: "890 Ko", deposeeLe: "2026-05-04", parVous: true },
      { id: 6, nom: "Autorisation-signee.pdf", taille: "1,1 Mo", deposeeLe: "2026-05-28", parVous: false },
    ],
  },
];

export const ECHANGES_DEMO: Echange[] = [
  {
    id: 1,
    reference: "AO-2026-014",
    intitule: "Appel d'offres — fourniture d'équipements de manutention, lot 3",
    nature: "Marché public",
    ouvertLe: "2026-07-15",
    echeance: "2026-08-29",
    attendus: 5,
    deposes: 3,
    etat: "En attente de votre dépôt",
  },
  {
    id: 2,
    reference: "CV-2024-007",
    intitule: "Convention d'occupation du terre-plein sud",
    nature: "Convention",
    ouvertLe: "2024-03-01",
    echeance: null,
    attendus: 2,
    deposes: 2,
    etat: "Ouvert",
  },
  {
    id: 3,
    reference: "RG-2026-S1",
    intitule: "Reporting semestriel des volumes traités",
    nature: "Reporting réglementaire",
    ouvertLe: "2026-07-01",
    echeance: "2026-07-31",
    attendus: 1,
    deposes: 1,
    etat: "Clos",
  },
  {
    id: 4,
    reference: "RG-2026-S2",
    intitule: "Reporting semestriel des volumes traités",
    nature: "Reporting réglementaire",
    ouvertLe: "2026-08-01",
    echeance: "2027-01-31",
    attendus: 1,
    deposes: 0,
    etat: "Ouvert",
  },
];

export const PREFERENCES_DEMO: Preferences = {
  courriel: "contact@camrail.cm",
  telephone: "+237 6 99 00 11 22",
  canal: "Courriel",
  evenements: [
    { cle: "depot", libelle: "Accusé de réception de mes dépôts", actif: true },
    { cle: "complement", libelle: "Demande de pièce complémentaire", actif: true },
    { cle: "decision", libelle: "Décision rendue sur ma demande", actif: true },
    { cle: "echeance", libelle: "Rappel avant une échéance qui me concerne", actif: true },
    { cle: "cloture", libelle: "Clôture et archivage de mon dossier", actif: false },
  ],
};
