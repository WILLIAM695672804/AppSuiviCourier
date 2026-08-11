import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NiveauFeu } from "@/lib/feu";

/**
 * Domaine « direction » — la vue d'ensemble du Directeur général.
 *
 * Un domaine a lui seul, et non une route de plus dans `pilotage`, parce que
 * cette restitution n'appartient qu'a un poste : elle n'est ni filtrable par
 * perimetre, ni declinable par structure, et personne d'autre ne la consulte.
 * La ranger avec le cockpit du Comite de direction aurait fini par les faire
 * evoluer ensemble, ce qui est exactement ce qu'on veut eviter.
 *
 * Le cockpit repond a « qu'est-ce qui appelle une decision ce matin ? ». Cette
 * vue-ci repond a « ou en est l'institution ce trimestre ? ». Deux questions,
 * deux ecrans : la premiere se lit en trente secondes et porte des liens, la
 * seconde se lit en trois minutes et porte des courbes.
 */

/** Un des chiffres de la bande haute. Sept au plus : au-dela, on ne lit plus. */
export interface RepereDirection {
  libelle: string;
  /** Deja formatee par le serveur — un pourcentage, un delai, un effectif. */
  valeur: string;
  /** Precision sous la valeur. « — » quand la mesure n'est pas disponible. */
  note: string | null;
}

export interface SerieMensuelle {
  mois: string;
  valeur: number;
}

export interface PartDirection {
  libelle: string;
  valeur: number;
}

export interface VueEnsembleDirection {
  institution: string;
  /** Horodatage du dernier calcul, tel qu'il s'affiche en haut a droite. */
  actualiseLe: string;
  exercice: string;
  reperes: RepereDirection[];
  /**
   * Variation mensuelle du taux d'execution, en points.
   * Une variation, donc une mesure qui peut etre negative : c'est le seul
   * graphique de l'ecran dont l'axe traverse le zero.
   */
  ecartExecution: SerieMensuelle[];
  /** Les cinq structures qui portent le plus de courrier en cours. */
  chargeParStructure: PartDirection[];
  /** Les cinq correspondants dont le volume entrant est le plus fort. */
  volumeParCorrespondant: PartDirection[];
  /** Taux de courriers traites dans le delai imparti, mois par mois. */
  respectDelais: SerieMensuelle[];
  /** Decisions d'instance executees dans le mois. */
  decisionsExecutees: SerieMensuelle[];
  /*
   * Ce que le Directeur general a demande le 11 aout 2026, et qui ne vient
   * d'aucun courrier : l'etat du port lui-meme.
   *
   * Nullable, parce que ces chiffres dependent de structures qui les
   * saisissent. Un mois sans releve doit se lire comme tel — « aucun releve
   * depuis le 5 aout » — et non comme une cote a zero, qui aurait signifie que
   * le chenal est comble.
   */
  chenal: CoteChenal | null;
  recouvrements: SyntheseRecouvrements | null;
}

/** La cote qui borne l'acces au port, et depuis quand. */
export interface CoteChenal {
  point: string;
  cote: number;
  garantie: number;
  ecart: number;
  feu: NiveauFeu;
  releveLe: string;
  /** Evolution de ce meme point, mois par mois. */
  evolution: SerieMensuelle[];
}

export interface SyntheseRecouvrements {
  periode: string;
  tauxGlobal: number;
  /** Recouvre du mois, en francs CFA. */
  totalRecouvre: number;
  /** La coupure demandee : ce qui vient de l'exploitation, et le reste. */
  totalExploitation: number;
  totalAutresRecettes: number;
  /** Taux de recouvrement par secteur, pour l'histogramme. */
  parSecteur: PartDirection[];
}

const CLE = "direction";

export const vueEnsembleDirectionQuery = () =>
  queryOptions({
    queryKey: [CLE, "vue-ensemble"],
    queryFn: ({ signal }) => api.get<VueEnsembleDirection>("/direction/vue-ensemble", signal),
  });
