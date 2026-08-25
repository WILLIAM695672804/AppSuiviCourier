import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
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

/**
 * Règle de gestion paramétrable — zone H.
 *
 * À ne pas confondre avec `RegleSelection`, qui choisit un circuit d'après le
 * type d'un courrier. Celle-ci est une règle de gestion : un délai, un seuil,
 * un plafond. Le métier appelle les deux « règle », d'où les deux onglets.
 *
 * `statut` porte tout le sens de cet écran. Une règle `hypothese` est une
 * **invention de la conception**, faute de réponse du métier : le nombre affiché
 * n'engage personne, et la colonne `aTrancherPar` dit qui doit se prononcer. Une
 * règle `acte` sort d'un document, cité dans `source`.
 */
export interface RegleMetier {
  cle: string;
  libelle: string;
  valeur: string;
  typeValeur: "entier" | "decimal" | "texte" | "booleen";
  domaine: string;
  statut: "acte" | "hypothese";
  /** Redondant avec `statut`, et volontairement : c'est ce que l'écran ne doit
   *  pas laisser manquer, et une comparaison de chaîne se trompe en silence. */
  estHypothese: boolean;
  /** La référence de l'arbitrage. Vide tant que la règle est une hypothèse. */
  source: string | null;
  /** Qui doit trancher. Effacé au moment où l'arbitrage tombe. */
  aTrancherPar: string | null;
  modifieLe: string | null;
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
  reglesMetier: RegleMetier[];
}

export const parametrageQuery = () =>
  queryOptions({
    queryKey: ["parametrage"],
    queryFn: ({ signal }) => api.get<DonneesParametrage>("/parametrage", signal),
    staleTime: 5 * 60 * 1000,
  });

/**
 * Change la valeur d'une règle sans toucher à son statut.
 *
 * `source` est facultative pour une hypothèse — l'ajuster ne fait que remplacer
 * une invention par une autre — et **exigée** pour un acte : le serveur refuse
 * de modifier une règle arbitrée qui ne cite pas la décision qui la change.
 */
export function useModifierRegleMetier(cle: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: { valeur: string; source?: string }) =>
      api.patch<RegleMetier>(`/parametrage/regles-metier/${cle}`, saisie),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["parametrage"] });
    },
  });
}

/**
 * Fait passer une hypothèse au rang d'acte.
 *
 * `source` n'a pas de valeur par défaut, et ce n'est pas un oubli : sans
 * référence documentaire, l'arbitrage remplace une invention par une autre en
 * lui donnant l'étiquette d'une décision.
 *
 * `valeur` est facultative — le métier confirme souvent l'hypothèse telle
 * quelle, et l'obliger à retaper le chiffre est le meilleur moyen d'en obtenir
 * un faux.
 */
export function useTrancherRegleMetier(cle: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: { source: string; valeur?: string }) =>
      api.post<RegleMetier>(`/parametrage/regles-metier/${cle}/arbitrage`, saisie),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["parametrage"] });
      // Les écrans qui lisent une règle affichent une valeur qui vient de
      // changer : un délai annoncé à l'usager, un seuil de retard.
      void client.invalidateQueries({ queryKey: ["referentiel"] });
    },
  });
}
