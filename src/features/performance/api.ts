import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NiveauFeu } from "@/lib/feu";
import type { Periode } from "@/lib/periode";

/**
 * Domaine « performance » — la matrice de scoring administratif.
 *
 * Le descriptif fonctionnel la définit ainsi (§2) : « La matrice de scoring
 * administratif des structures agrège, sur une base mensuelle, les résultats
 * liés à l'exécution des activités, au traitement du courrier et des dossiers,
 * ainsi qu'à la conformité aux rituels. Elle produit ainsi un classement et
 * une évaluation globale de chaque structure. »
 *
 * Trois conséquences de conception :
 *
 *  — elle est mensuelle et se calcule sur un mois clos. Un classement du mois
 *    en cours n'est pas comparable d'une structure à l'autre ;
 *  — elle agrège quatre critères pondérés, et la pondération est un choix de
 *    gouvernance que la DSR administre. Elle vient donc du serveur, jamais du
 *    code ;
 *  — un score global sans sa décomposition est indéfendable. Un directeur
 *    classé neuvième doit pouvoir voir lequel des quatre critères l'y place,
 *    sans quoi le classement ne produit que du ressentiment.
 */

export interface CritereScore {
  code: string;
  libelle: string;
  /** Poids dans le score global, en pourcentage. Administré par la DSR. */
  poids: number;
  /** Note sur 100. */
  note: number;
  feu: NiveauFeu;
}

export interface LigneClassement {
  rang: number;
  /** Rang du mois précédent, pour l'évolution. `null` si nouvelle entrante. */
  rangPrecedent: number | null;
  structureSigle: string;
  structureLibelle: string;
  scoreGlobal: number;
  feu: NiveauFeu;
  criteres: CritereScore[];
}

export interface Matrice {
  periode: Periode;
  /** Vrai quand la période n'est pas close : le classement est alors indicatif. */
  provisoire: boolean;
  lignes: LigneClassement[];
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
  moyenneInstitution: number;
}

export interface SousIndicateur {
  libelle: string;
  valeur: string;
  cible: string;
  taux: number;
  feu: NiveauFeu;
}

export interface CritereDetaille extends CritereScore {
  /** Ce qui compose la note : c'est ici que le score devient discutable. */
  sousIndicateurs: SousIndicateur[];
}

export interface FicheStructure {
  structureSigle: string;
  structureLibelle: string;
  periode: Periode;
  rang: number;
  rangPrecedent: number | null;
  totalStructures: number;
  scoreGlobal: number;
  scorePrecedent: number | null;
  feu: NiveauFeu;
  moyenneInstitution: number;
  criteres: CritereDetaille[];
  /** Douze derniers scores mensuels, pour la courbe. */
  historique: { periode: string; score: number }[];
}

export type Periodicite = "Mensuelle" | "Trimestrielle" | "Semestrielle" | "Annuelle";

/**
 * Dictionnaire des indicateurs — §3.3.
 *
 * « Maintenir le dictionnaire des indicateurs : définition, formule de calcul,
 * source, périodicité, responsable. » Ces cinq champs sont ce qui empêche deux
 * directions de calculer le même indicateur de deux façons.
 */
export interface IndicateurDictionnaire {
  id: number;
  code: string;
  libelle: string;
  definition: string;
  formule: string;
  source: string;
  periodicite: Periodicite;
  responsable: string;
  unite: string;
  seuilVert: number;
  seuilOrange: number;
  /** Critère de la matrice que l'indicateur alimente, s'il en alimente un. */
  critere: string | null;
  actif: boolean;
}

/** Grille de cotation des risques — §3.3, maintenue avec le dictionnaire. */
export interface NiveauRisque {
  niveau: number;
  libelle: string;
  description: string;
  conduite: string;
  feu: NiveauFeu;
}

export interface Dictionnaire {
  indicateurs: IndicateurDictionnaire[];
  risques: NiveauRisque[];
}

/**
 * Calendrier officiel de production — §3.3.
 *
 * « Piloter le calendrier officiel de production : qui alimente quoi, à quelle
 * fréquence, avec relances automatiques en cas de non-saisie. » C'est le
 * contrat de service entre la DSR et les structures : sans lui, la matrice se
 * calcule sur des données incomplètes et ne vaut rien.
 */
export interface LigneCalendrier {
  id: number;
  production: string;
  nature: string;
  periodicite: Periodicite;
  /** Formulation littérale : « le 5 du mois suivant ». */
  echeance: string;
  structuresAttendues: number;
  responsable: string;
  relanceAutomatique: boolean;
  /** Jours avant échéance auxquels part la relance. */
  joursAvantRelance: number | null;
  /** Résultat du dernier cycle clos. */
  recus: number;
  feu: NiveauFeu;
}

export interface Calendrier {
  lignes: LigneCalendrier[];
  compteurs: { libelle: string; valeur: number; note: string; feu: NiveauFeu }[];
}

const CLE = "performance";

export const matriceQuery = (annee: number, mois: number) =>
  queryOptions({
    queryKey: [CLE, "matrice", annee, mois],
    queryFn: ({ signal }) => api.get<Matrice>(`/performance/matrice?annee=${annee}&mois=${mois}`, signal),
    placeholderData: (precedent) => precedent,
  });

export const ficheStructureQuery = (sigle: string, annee: number, mois: number) =>
  queryOptions({
    queryKey: [CLE, "structure", sigle, annee, mois],
    queryFn: ({ signal }) =>
      api.get<FicheStructure>(
        `/performance/matrice/${encodeURIComponent(sigle)}?annee=${annee}&mois=${mois}`,
        signal,
      ),
  });

export const dictionnaireQuery = () =>
  queryOptions({
    queryKey: [CLE, "dictionnaire"],
    queryFn: ({ signal }) => api.get<Dictionnaire>("/performance/dictionnaire", signal),
  });

export const calendrierQuery = () =>
  queryOptions({
    queryKey: [CLE, "calendrier"],
    queryFn: ({ signal }) => api.get<Calendrier>("/performance/calendrier", signal),
  });

/* ------------------------------------------------------------------ *
 *  Ecritures
 *
 *  Toucher au dictionnaire ou au calendrier change la regle de mesure, pas
 *  seulement une donnee. Les tableaux de bord et le classement sont donc
 *  invalides en meme temps : un seuil modifie qui laisserait l'ancien
 *  classement a l'ecran serait pire qu'un seuil non modifie.
 * ------------------------------------------------------------------ */

export interface SaisieIndicateur {
  code: string;
  libelle: string;
  definition: string;
  formule: string;
  source: string;
  periodicite: Periodicite;
  responsable: string;
  unite: string;
  seuilVert: number;
  seuilOrange: number;
  critere: string | null;
}

export interface SaisieProduction {
  production: string;
  nature: string;
  periodicite: Periodicite;
  echeance: string;
  structuresAttendues: number;
  responsable: string;
  relanceAutomatique: boolean;
  joursAvantRelance: number | null;
}

function useEcriture<TCorps>(chemin: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (corps: TCorps) => api.post<{ id: number }>(chemin, corps),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [CLE] });
      void client.invalidateQueries({ queryKey: ["pilotage"] });
    },
  });
}

export const useCreerIndicateur = () => useEcriture<SaisieIndicateur>("/performance/indicateurs");

export const useCreerProduction = () => useEcriture<SaisieProduction>("/performance/calendrier");
