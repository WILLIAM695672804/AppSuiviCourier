import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NiveauFeu } from "@/lib/feu";

/**
 * Domaine « supervision » — l'exploitation technique de la plateforme.
 *
 * Deux missions du §3.10, et deux écrans :
 *
 *  — « Superviser la disponibilité de la plateforme et la performance des
 *    tableaux de bord » ;
 *  — « Gérer l'authentification unique (SSO) via l'annuaire d'entreprise et
 *    l'intégration aux applicatifs existants ».
 *
 * La troisième — consulter les journaux — est déjà servie par l'écran de
 * traçabilité, qu'il partage avec l'auditeur.
 *
 * Les seuils viennent du BRD et non d'un choix d'affichage : disponibilité de
 * 99,5 % en heures ouvrées (RNF-DISP-01), reprise en moins de 4 heures
 * (RNF-DISP-02), temps de réponse sous 2 secondes pour 95 % des transactions
 * (RNF-PERF-01). Ce sont des engagements contractuels : l'écran doit dire s'ils
 * sont tenus, pas seulement afficher des chiffres.
 */

export type EtatService = "Opérationnel" | "Dégradé" | "Interrompu";

export interface ServicePlateforme {
  nom: string;
  role: string;
  etat: EtatService;
  /** Disponibilité constatée sur trente jours glissants, en pourcentage. */
  disponibilite: number;
  tempsReponseMs: number;
  feu: NiveauFeu;
}

export type GraviteIncident = "Majeur" | "Mineur" | "Information";

export interface Incident {
  id: number;
  debut: string;
  fin: string | null;
  gravite: GraviteIncident;
  service: string;
  resume: string;
  impact: string;
  /** `null` tant que l'incident court. */
  resolution: string | null;
  dureeMinutes: number | null;
}

/** Performance d'un écran, mesurée côté serveur. RNF-PERF-01. */
export interface PerformanceEcran {
  ecran: string;
  appels24h: number;
  p50Ms: number;
  p95Ms: number;
  feu: NiveauFeu;
}

export interface Supervision {
  disponibilite30j: number;
  cibleDisponibilite: number;
  services: ServicePlateforme[];
  incidents: Incident[];
  performances: PerformanceEcran[];
  compteurs: { libelle: string; valeur: string; note: string; feu: NiveauFeu }[];
  /** Plan de reprise d'activité — RNF-DISP-02. */
  pra: {
    dernierTest: string | null;
    dureeRepriseMinutes: number | null;
    cibleMinutes: number;
    feu: NiveauFeu;
  };
}

export type TypeIntegration = "Annuaire" | "Messagerie" | "Système financier" | "ERP" | "Portail usagers";

export type EtatIntegration = "Connecté" | "Dégradé" | "Non connecté" | "En construction";

export interface Integration {
  id: number;
  systeme: string;
  type: TypeIntegration;
  protocole: string;
  etat: EtatIntegration;
  derniereSynchronisation: string | null;
  latenceMs: number | null;
  /** Nombre d'objets synchronisés au dernier passage. */
  volumeDernierPassage: number | null;
  erreurs24h: number;
  feu: NiveauFeu;
  note: string | null;
}

/**
 * État de l'authentification unique — RF-ADM-02 (Must).
 *
 * Le chiffre qui compte n'est pas le nombre de comptes annuaire, mais le
 * nombre de comptes qui se connectent encore par mot de passe applicatif :
 * tant qu'ils existent, le SSO n'est pas la porte d'entrée mais une porte
 * parmi deux, et la politique de mot de passe de l'annuaire ne s'applique pas
 * à tout le monde.
 */
export interface EtatSso {
  actif: boolean;
  fournisseur: string;
  protocole: string;
  domaines: string[];
  comptesAnnuaire: number;
  comptesLocaux: number;
  dernierImport: string | null;
  connexionsSso7j: number;
  connexionsLocales7j: number;
  feu: NiveauFeu;
}

export interface Integrations {
  sso: EtatSso;
  integrations: Integration[];
  compteurs: { libelle: string; valeur: string; note: string; feu: NiveauFeu }[];
}

const CLE = "supervision";

export const supervisionQuery = () =>
  queryOptions({
    queryKey: [CLE, "plateforme"],
    queryFn: ({ signal }) => api.get<Supervision>("/supervision", signal),
  });

export const integrationsQuery = () =>
  queryOptions({
    queryKey: [CLE, "integrations"],
    queryFn: ({ signal }) => api.get<Integrations>("/supervision/integrations", signal),
  });
