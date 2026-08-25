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
  "Enregistrement" | "Cotation" | "Traitement" | "Signature" | "Paramétrage" | "Habilitation";

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

/**
 * Les quatre actions que le journal des acces peut rendre.
 *
 * L'union portait un cinquieme membre, « Refusé », que le serveur ne peut pas
 * produire : `journal_acces.action` est tenue par la contrainte
 * `journal_action_valide`, qui n'accepte que `consultation`, `liste`,
 * `impression`, `export` et `telechargement` (`init_base.sql`). Un refus d'acces
 * n'est donc **pas journalise** aujourd'hui, et un type qui l'annonce se lit
 * comme une specification : l'ecran d'audit filtrerait sur une valeur qui
 * n'arrive jamais, sans que rien ne le dise. Voir A64 dans
 * `docs/questions-ouvertes.md`.
 *
 * `liste` n'y figure pas non plus : le serveur la rend sous « Consultation ».
 */
export type ActionAcces = "Consultation" | "Téléchargement" | "Impression" | "Export";

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
  activite: {
    libelle: string;
    valeur: string;
    part: string;
    alerte: boolean;
  }[];
}

export interface JournalEvenements {
  compteurs: {
    libelle: string;
    valeur: string;
    note: string;
    ton: "neutre" | "alerte" | "danger";
  }[];
  evenements: EvenementJournal[];
}

/**
 * Combien de lignes on demande d'un coup, et de combien on augmente.
 *
 * Le serveur borne à 1000 : au-delà, ce n'est plus de la consultation mais de
 * l'extraction. Un écran qui demanderait tout ne s'afficherait jamais — la
 * table est partitionnée et compte des millions de lignes en régime établi.
 */
export const PAS_JOURNAL = 200;

export const journalEvenementsQuery = (filtre: string, limite: number = PAS_JOURNAL) =>
  queryOptions({
    queryKey: ["tracabilite", "evenements", filtre, limite],
    queryFn: ({ signal }) =>
      api.get<JournalEvenements>(`/tracabilite/evenements?type=${filtre}&limite=${limite}`, signal),
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
  /** `null` quand aucune règle ne couvre la typologie du dossier. */
  echeanceSortFinal: string | null;
}

export interface ConformiteArchivistique {
  compteurs: {
    libelle: string;
    valeur: number;
    note: string;
    feu: "vert" | "orange" | "rouge" | "inconnu";
  }[];
  echeancesDepassees: DossierNonConforme[];
  typologiesSansRegle: string[];
  /** `null` sur un fonds vide — voir `features/archivage/api.ts`. */
  tauxConformite: number | null;
}

export const conformiteQuery = () =>
  queryOptions({
    queryKey: ["tracabilite", "conformite"],
    queryFn: ({ signal }) => api.get<ConformiteArchivistique>("/archivage/conformite", signal),
  });

export const journalAccesQuery = (filtre: string, limite: number = PAS_JOURNAL) =>
  queryOptions({
    queryKey: ["tracabilite", "acces", filtre, limite],
    queryFn: ({ signal }) =>
      api.get<{ acces: AccesJournal[]; signales: number }>(
        `/tracabilite/acces?filtre=${filtre}&limite=${limite}`,
        signal,
      ),
    placeholderData: (precedent) => precedent,
  });

/**
 * Historique des champs — I-03.
 *
 * **Ce n'est pas le journal des événements sous un autre angle.** Les deux
 * tables sont alimentées par des chemins indépendants : `evenement` par le code
 * applicatif, `champ_historique` par un déclencheur PostgreSQL. Une modification
 * faite en SQL direct — correction en base, script de reprise, intervention d'un
 * prestataire — laisse une ligne ici et **aucune** là-bas.
 *
 * C'est tout l'intérêt de l'écran, et la raison de `horsApplication`.
 */
export interface TableTracee {
  cle: string;
  libelle: string;
  /** Rendu même à zéro : une table jamais modifiée doit figurer au sélecteur. */
  modifications: number;
}

export interface ModificationChamp {
  id: number;
  date: string;
  heure: string;
  /** Le nom SQL de la table — un auditeur qui recoupe avec la base en a besoin. */
  table: string;
  tableLibelle: string;
  ligneId: number;
  /** Le nom de la colonne, tel qu'il est en base. Non traduit. */
  colonne: string;
  avant: string;
  apres: string;
  auteur: string;
  initiales: string;
  poste: string;
  /** Aucun événement applicatif n'explique cette modification. */
  horsApplication: boolean;
}

export interface HistoriqueChamps {
  tables: TableTracee[];
  modifications: ModificationChamp[];
  /** Sur ce qui est affiché, pas sur la table entière. */
  horsApplication: number;
}

export const historiqueChampsQuery = (
  table: string,
  horsApplication: boolean,
  limite: number = PAS_JOURNAL,
) =>
  queryOptions({
    queryKey: ["tracabilite", "historique", table, horsApplication, limite],
    queryFn: ({ signal }) => {
      const parametres = new URLSearchParams({ limite: String(limite) });
      // « Toutes » n'est pas une valeur du serveur : c'est l'absence de filtre.
      // L'envoyer telle quelle ramènerait zéro ligne, ce qui se lirait comme
      // « rien n'a changé ».
      if (table !== "Toutes") parametres.set("tableCible", table);
      if (horsApplication) parametres.set("horsApplication", "true");
      return api.get<HistoriqueChamps>(`/tracabilite/historique?${parametres}`, signal);
    },
    placeholderData: (precedent) => precedent,
  });
