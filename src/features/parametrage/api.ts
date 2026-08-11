import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Domaine « parametrage » : ce qui se regle sans livraison de code.
 *
 * Modeles de circuit, regles de selection, mentions, correspondants, delais.
 * Tout ce qui est ici a ete sorti du code exprès : l'institution change ses
 * circuits et ses delais plus souvent qu'elle ne change de logiciel.
 */
export interface ModeleCircuit {
  id: number;
  libelle: string;
  sappliqueA: string;
  nombreEtapes: number;
  delaiCible: number;
  usage: number;
  actif: boolean;
}

export interface RegleSelection {
  id: number;
  ordre: number;
  condition: string;
  circuit: string;
  declenchements: number;
  /** La derniere regle est le repli : elle s'applique quand rien d'autre ne correspond. */
  repli: boolean;
}

export interface MentionCotation {
  id: number;
  libelle: string;
  delaiAssocie: number | null;
  comportement: string;
  niveauxAutorises: string[];
  active: boolean;
}

export interface CorrespondantAdmin {
  id: number;
  libelle: string;
  categorie: string;
  ville: string;
  nombreCourriers: number;
  /** Doublon presume : meme nom normalise qu'un autre correspondant. */
  doublonPresume: boolean;
}

export interface Engagement {
  id: number;
  libelle: string;
  delaiCible: number;
  premiereAlerte: number;
  respect90j: number;
}

/**
 * Étape d'un circuit, avec son délai et sa règle d'escalade — RF-BPM-01 et 03.
 *
 * Le BRD demande une modélisation « en notation BPMN 2.0 ». Ce n'est pas ce
 * qu'on trouve ici : les étapes sont une liste ordonnée, pas un diagramme. Le
 * choix est assumé et documenté à l'écran — un modeleur graphique BPMN suppose
 * une bibliothèque de plusieurs centaines de kilo-octets, et surtout des
 * branchements parallèles que le circuit du courrier n'emploie pas.
 *
 * Ce qui compte y est : l'ordre, l'acteur, le délai par étape, et ce qui se
 * passe quand le délai est dépassé.
 */
export interface EtapeCircuit {
  id: number;
  circuitId: number;
  rang: number;
  libelle: string;
  /** Profil ou structure qui agit à cette étape. */
  acteur: string;
  /** Délai propre à l'étape, en jours ouvrés. */
  delaiJours: number;
  /** Ce qui se produit à l'échéance : relance, escalade au N+1, ou rien. */
  escalade: "Relance automatique" | "Escalade au supérieur" | "Aucune";
  /** Jours avant l'échéance auxquels part l'alerte. */
  alerteAvant: number | null;
  /** Une étape non bloquante peut être contournée en circuit accéléré (RF-BPM-10). */
  bloquante: boolean;
}

/**
 * Plan de classement — RF-GED-07.
 *
 * Arborescence métier dans laquelle les documents se rangent. Distinct du
 * référentiel de conservation, qui dit combien de temps on les garde : l'un
 * range, l'autre élimine.
 */
export interface RubriqueClassement {
  id: number;
  code: string;
  libelle: string;
  /** Profondeur, pour l'indentation. 0 pour les rubriques de tête. */
  niveau: number;
  parentId: number | null;
  documents: number;
  typologiesAssociees: string[];
}

/**
 * Seuil d'alerte — RF-BI-05 et RF-ADM-04.
 *
 * « Définition d'alertes automatiques sur dépassement de seuils métier. »
 * Chaque seuil dit quoi surveiller, à partir de quelle valeur, et qui prévenir.
 * Sans destinataire, une alerte n'est qu'une couleur à l'écran.
 */
export interface SeuilAlerte {
  id: number;
  indicateur: string;
  perimetre: string;
  operateur: "supérieur à" | "inférieur à";
  valeur: number;
  unite: string;
  destinataire: string;
  canal: "Notification interne" | "Courriel" | "Les deux";
  actif: boolean;
  declenchements30j: number;
}

export interface DonneesParametrage {
  circuits: ModeleCircuit[];
  etapes: EtapeCircuit[];
  regles: RegleSelection[];
  mentions: MentionCotation[];
  correspondants: CorrespondantAdmin[];
  engagements: Engagement[];
  classement: RubriqueClassement[];
  seuils: SeuilAlerte[];
}

export const parametrageQuery = () =>
  queryOptions({
    queryKey: ["parametrage"],
    queryFn: ({ signal }) => api.get<DonneesParametrage>("/parametrage", signal),
    staleTime: 5 * 60 * 1000,
  });
