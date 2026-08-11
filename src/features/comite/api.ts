import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Domaine « comité » — la vue d'ensemble du Comité de direction.
 *
 * Le Comité de direction est le conseil des directeurs : l'instance où ils
 * siègent ensemble, et non un poste occupé par quelqu'un. Cette page est donc
 * la vue de l'instance, pas celle d'un membre — elle porte sur toutes les
 * directions, et le membre connecté y retrouve la sienne à sa place, ni
 * davantage ni à part.
 *
 * C'était l'erreur de la première version : tout y était rapporté au sigle du
 * membre — « ma direction », « mes activités », « les décisions qui
 * m'engagent ». Elle répondait à « où se situe ma direction », quand le Comité
 * se réunit pour répondre à « où se situent les directions les unes par rapport
 * aux autres, et laquelle décroche ».
 *
 * Un domaine à lui seul, à côté de `direction` et non dedans, pour la raison
 * qui a fait sortir `direction` de `pilotage` : deux restitutions qui se
 * ressemblent finissent par évoluer ensemble si elles partagent un fichier, et
 * ces deux-là ne doivent pas.
 *
 * Ce qui les sépare tient en une phrase. La vue du Directeur général répond à
 * « où en est l'institution ? » : elle agrège le courrier, les délais, les
 * correspondants, et depuis peu l'état du port. Celle-ci répond à « où se
 * situent les directions ? » : elle compare, direction par direction, et ne
 * connaît ni correspondant ni chenal.
 *
 * Le périmètre est institutionnel, et c'est une exception assumée au
 * cloisonnement par structure — comme celle du Directeur général. Un conseil
 * de directeurs qui ne verrait pas les directions ne délibérerait sur rien.
 */

/** Un des chiffres de la bande haute. Sept au plus : au-delà, on ne lit plus. */
export interface RepereComite {
  libelle: string;
  /** Déjà formatée par le serveur — un pourcentage, un effectif, un score. */
  valeur: string;
  /** Précision sous la valeur. « — » quand la mesure n'est pas disponible. */
  note: string | null;
}

export interface SerieMensuelleComite {
  mois: string;
  valeur: number;
}

export interface PartComite {
  libelle: string;
  valeur: number;
}

export interface VueEnsembleComite {
  institution: string;
  /**
   * Sigle de la direction du membre connecté, quand il en dirige une.
   *
   * Il ne commande plus le contenu de la page — seulement la mise en évidence
   * de sa colonne au classement. Un directeur siège au Comité sans cesser de
   * répondre de sa branche : lui montrer où elle tombe dans l'ensemble est
   * utile, la lui montrer seule ne l'était pas.
   */
  structureSigle: string | null;
  /** Horodatage du dernier calcul, tel qu'il s'affiche en haut à droite. */
  actualiseLe: string;
  exercice: string;
  reperes: RepereComite[];
  /**
   * Score global de chaque direction. Le graphique central de l'écran : c'est
   * la matière même de la délibération du Comité.
   */
  scoreParStructure: PartComite[];
  /** Décisions du Comité de direction, réparties par état d'exécution. */
  decisionsParEtat: PartComite[];
  /** Les activités de toutes les directions, réparties par état. */
  activitesParEtat: PartComite[];
  /**
   * Score moyen des directions, mois par mois.
   * Un classement ne dit pas si l'ensemble progresse : deux directions peuvent
   * échanger leurs rangs pendant que toutes décrochent.
   */
  evolutionScoreMoyen: SerieMensuelleComite[];
  /**
   * Écart entre la direction la mieux notée et la moins bien notée, par mois.
   * C'est la dispersion du collège : elle dit si l'institution avance groupée
   * ou si un peloton se détache.
   */
  dispersion: SerieMensuelleComite[];
}

const CLE = "comite";

export const vueEnsembleComiteQuery = () =>
  queryOptions({
    queryKey: [CLE, "vue-ensemble"],
    queryFn: ({ signal }) => api.get<VueEnsembleComite>("/comite/vue-ensemble", signal),
  });
