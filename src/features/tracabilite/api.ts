import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Domaine « tracabilite ».
 *
 * Deux journaux distincts, et cette distinction est le fond du sujet :
 * le journal des evenements dit ce qui a ete FAIT au courrier, le journal des
 * acces dit qui l'a SEULEMENT REGARDE. Le second est celui qu'on consulte
 * quand une information a fuite.
 *
 * Ces journaux sont en ecriture seule. Aucune methode de modification ni de
 * suppression n'existe ici, pas meme pour un administrateur.
 */
export type TypeEvenement =
  | "Enregistrement"
  | "Cotation"
  | "Traitement"
  | "Signature"
  | "Paramétrage"
  | "Habilitation";

export interface EvenementJournal {
  id: number;
  heure: string;
  date: string;
  type: TypeEvenement;
  libelle: string;
  courrier: string | null;
  courrierId: number | null;
  auteur: string;
  initiales: string;
  poste: string;
  champs: { libelle: string; valeur: string }[];
  /** Valeurs avant/apres. C'est ce qui distingue un journal d'une simple liste. */
  differences: { champ: string; avant: string; apres: string }[];
}

export type ActionAcces = "Consultation" | "Téléchargement" | "Impression" | "Export" | "Refusé";

export interface AccesJournal {
  id: number;
  heure: string;
  date: string;
  agent: string;
  initiales: string;
  poste: string;
  objet: string;
  session: string;
  action: ActionAcces;
  controle: "Conforme" | "Signalé";
  champs: { libelle: string; valeur: string; alerte: boolean }[];
  motif: string;
  alerte: boolean;
  activite: { libelle: string; valeur: string; part: string; alerte: boolean }[];
}

export interface JournalEvenements {
  compteurs: { libelle: string; valeur: string; note: string; ton: "neutre" | "alerte" | "danger" }[];
  evenements: EvenementJournal[];
}

export const journalEvenementsQuery = (filtre: string) =>
  queryOptions({
    queryKey: ["tracabilite", "evenements", filtre],
    queryFn: ({ signal }) => api.get<JournalEvenements>(`/tracabilite/evenements?type=${filtre}`, signal),
    placeholderData: (precedent) => precedent,
  });

/**
 * Conformité archivistique, vue par l'auditeur — §3.12, deuxième point.
 *
 * « Vérifier l'application effective du référentiel de conservation et le
 * respect des durées légales d'archivage. »
 *
 * Les types sont déclarés ici et non importés du domaine « archivage » : une
 * fonctionnalité n'en importe jamais une autre. Ce n'est pas une contrainte
 * gratuite — l'auditeur ne voit pas les mêmes champs que l'archiviste. Il n'a
 * ni les pièces, ni la chaîne d'empreintes, ni les actions ; il a le constat.
 */
export interface DossierNonConforme {
  id: number;
  reference: string;
  objet: string;
  typologie: string;
  structure: string;
  sortFinal: string;
  echeanceSortFinal: string;
}

export interface ConformiteArchivistique {
  compteurs: { libelle: string; valeur: number; note: string; feu: "vert" | "orange" | "rouge" | "inconnu" }[];
  echeancesDepassees: DossierNonConforme[];
  typologiesSansRegle: string[];
  tauxConformite: number;
}

export const conformiteQuery = () =>
  queryOptions({
    queryKey: ["tracabilite", "conformite"],
    queryFn: ({ signal }) => api.get<ConformiteArchivistique>("/archivage/conformite", signal),
  });

export const journalAccesQuery = (filtre: string) =>
  queryOptions({
    queryKey: ["tracabilite", "acces", filtre],
    queryFn: ({ signal }) =>
      api.get<{ acces: AccesJournal[]; signales: number }>(
        `/tracabilite/acces?filtre=${filtre}`,
        signal,
      ),
    placeholderData: (precedent) => precedent,
  });
