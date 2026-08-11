import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Domaine « administration » — le tableau de bord de l'administrateur.
 *
 * Il ne compte pas des courriers mais des ACTIONS : ce que l'application a
 * enregistre dans le journal des evenements. La distinction est le fond du
 * sujet. Un administrateur fonctionnel n'a pas de portefeuille a suivre ; ce
 * qu'il surveille, c'est l'usage de l'outil, l'etat de son referentiel et les
 * acces qui sortent de l'ordinaire.
 *
 * Toutes les valeurs viennent du serveur deja calculees et deja formatees :
 * l'ecran n'agrege rien, il affiche. Les totaux d'une institution ne se
 * calculent pas dans un navigateur.
 */
export type PeriodeAdmin = "30j" | "trimestre" | "annee";

export type TonIndicateur = "accent" | "succes" | "alerte" | "danger";

export interface IndicateurAdmin {
  libelle: string;
  valeur: string;
  variation: string | null;
  ton: TonIndicateur;
  note: string | null;
}

/** Un point de la courbe d'activite. Le libelle de periode vient du serveur. */
export interface PointActivite {
  periode: string;
  operations: number;
}

/** Repartition par type d'operation — memes libelles que `TypeEvenement`. */
export interface RepartitionType {
  libelle: string;
  valeur: number;
  /** Part en pourcentage, arrondie par le serveur. */
  part: number;
}

export interface LigneAdoption {
  structure: string;
  actifs: number;
  habilites: number;
  operations: number;
  part: number;
  /** `null` quand la structure n'a rien fait sur la periode. */
  derniereActivite: string | null;
}

export interface CompteurReferentiel {
  libelle: string;
  valeur: number;
}

/**
 * Un defaut du referentiel : un compte sans profil, une delegation expiree.
 * `chemin` porte l'ecran ou la corriger — l'anomalie mene toujours au remede.
 */
export interface AnomalieReferentiel {
  libelle: string;
  nombre: number;
  chemin: string;
  ton: "alerte" | "danger";
}

export interface AlerteAcces {
  id: number;
  horodatage: string;
  agent: string;
  action: string;
  objet: string;
}

export interface TableauDeBordAdmin {
  indicateurs: IndicateurAdmin[];

  /** Volumetrie des operations. */
  activite: PointActivite[];
  operationsTotal: number;
  operationsVariation: string;
  parType: RepartitionType[];

  /** Adoption par structure. */
  adoption: LigneAdoption[];
  structuresInactives: number;

  /** Sante du referentiel. */
  referentiel: CompteurReferentiel[];
  anomalies: AnomalieReferentiel[];

  /** Supervision des acces. */
  acces: {
    signales: number;
    refuses: number;
    confidentiels: number;
    dernieres: AlerteAcces[];
  };
}

export const tableauDeBordAdminQuery = (periode: PeriodeAdmin) =>
  queryOptions({
    queryKey: ["administration", "tableau-de-bord", periode] as const,
    queryFn: ({ signal }) =>
      api.get<TableauDeBordAdmin>(`/administration/tableau-de-bord?periode=${periode}`, signal),
    // La periode change souvent : on garde l'ecran precedent pendant le chargement.
    placeholderData: (precedent) => precedent,
  });
