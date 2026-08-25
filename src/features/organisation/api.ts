import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Domaine « organisation » : structures, niveaux hierarchiques et postes.
 *
 * Ces deux tables sont la raison pour laquelle l'application ne connait aucun
 * nom de role : l'administrateur cree ses niveaux et ses postes, et les
 * permissions suivent. Ce fichier est donc le seul endroit ou l'on ecrit
 * l'ossature de l'institution.
 */
export interface NiveauHierarchique {
  id: number;
  rang: number;
  libelle: string;
  nombreStructures: number;
  nombrePostes: number;
  /** Ce que le niveau autorise, coche par coche. */
  peutCoter: boolean;
  peutRecevoirCotation: boolean;
  porteSignature: boolean;
  ligneStatistiques: boolean;
  niveauParentId: number | null;
}

/**
 * Un poste de travail et son occupation.
 *
 * Les quatre identifiants doublent les quatre libelles, et ce n'est pas une
 * redondance : le tableau lit `structure`, `niveau`, `profilParDefaut` ; le
 * formulaire de correction ecrit `structureId`, `niveauId`, `profilParDefautId`.
 * Les rendre ensemble evite de recharger la ligne pour la modifier.
 */
export interface PosteTravail {
  id: number;
  libelle: string;
  /** Le sigle de la structure. */
  structure: string;
  structureId: number;
  /** Le **libelle** de l'etage, pas son rang — c'est un tableau qu'on lit. */
  niveau: string;
  niveauId: number;
  /** Le poste au-dessus, souvent hors de la structure. */
  posteSuperieurId: number | null;
  /** « Non defini » quand le poste n'en propose aucun — jamais une chaine vide. */
  profilParDefaut: string;
  profilParDefautId: number | null;
  /** Agents **actifs** en poste. Un compte suspendu n'occupe plus le poste. */
  titulaires: number;
  postesPrevus: number;
}

/**
 * Une occupation de poste, ouverte ou close — F-04.
 *
 * `enCours` vaut `fin === null` et vient du serveur : le calculer ici aurait
 * fait diverger l'ecran de la ligne le jour ou une fin est saisie a la main.
 */
export interface Affectation {
  id: number;
  utilisateurId: number;
  agent: string;
  posteId: number;
  poste: string;
  /** Le sigle de la structure du poste, au moment de la lecture. */
  structure: string;
  debut: string;
  fin: string | null;
  enCours: boolean;
  motif: string | null;
}

export const clesOrganisation = {
  racine: ["organisation"] as const,
  niveaux: () => ["organisation", "niveaux"] as const,
  postes: () => ["organisation", "postes"] as const,
  affectations: (posteId: number | null) => ["organisation", "affectations", posteId] as const,
};

export const niveauxQuery = () =>
  queryOptions({
    queryKey: clesOrganisation.niveaux(),
    queryFn: ({ signal }) => api.get<NiveauHierarchique[]>("/organisation/niveaux", signal),
  });

export const postesQuery = () =>
  queryOptions({
    queryKey: clesOrganisation.postes(),
    queryFn: ({ signal }) => api.get<PosteTravail[]>("/organisation/postes", signal),
  });

/**
 * L'histoire des occupations, filtrable par poste.
 *
 * Sans filtre, la route rend l'organigramme entier — quelques centaines de
 * lignes, et c'est assume cote serveur. L'ecran filtre malgre tout des qu'un
 * poste est choisi : ce qu'on cherche en ouvrant l'onglet, c'est « qui a tenu
 * *ce* poste », pas la liste de tout le port.
 */
export const affectationsQuery = (posteId: number | null) =>
  queryOptions({
    queryKey: clesOrganisation.affectations(posteId),
    queryFn: ({ signal }) =>
      api.get<Affectation[]>(
        posteId === null ? "/organisation/affectations" : `/organisation/affectations?posteId=${posteId}`,
        signal,
      ),
    placeholderData: (precedent) => precedent,
  });

/**
 * Ce qu'un etage autorise — les quatre cases du panneau de droite.
 *
 * Regroupees parce qu'elles voyagent ensemble : la creation les envoie toutes,
 * la modification n'envoie que celles qui ont bouge.
 */
export interface AutorisationsNiveau {
  peutCoter: boolean;
  peutRecevoirCotation: boolean;
  porteSignature: boolean;
  ligneStatistiques: boolean;
}

/**
 * Creation d'un etage.
 *
 * `code` et `rang` n'apparaissent qu'ici. Le rang ordonne tout le referentiel :
 * le serveur refuse un rang deja tenu et ne renumerote pas a la place de
 * l'administrateur — decaler trois niveaux en silence deplacerait toutes leurs
 * structures.
 */
export interface SaisieNiveau extends AutorisationsNiveau {
  code: string;
  libelle: string;
  rang: number;
  niveauParentId: number | null;
}

/**
 * Modification d'un etage — tout est facultatif, et `undefined` veut dire
 * « ne touche pas ». Le rang n'y figure pas : il ne se corrige pas au milieu
 * d'un formulaire.
 */
export type SaisieModificationNiveau = Partial<AutorisationsNiveau> & {
  libelle?: string;
  niveauParentId?: number | null;
};

export function useCreerNiveau() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: SaisieNiveau) =>
      api.post<NiveauHierarchique>("/organisation/niveaux", saisie),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: clesOrganisation.racine });
      // Les selecteurs de structure affichent le niveau : ils vieillissent en
      // meme temps.
      void client.invalidateQueries({ queryKey: ["referentiel"] });
    },
  });
}

export function useModifierNiveau(niveauId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: SaisieModificationNiveau) =>
      api.patch<NiveauHierarchique>(`/organisation/niveaux/${niveauId}`, saisie),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: clesOrganisation.racine });
      void client.invalidateQueries({ queryKey: ["referentiel"] });
    },
  });
}

/* ------------------------------------------------------------------ *
 *  Les structures — F-01
 *
 *  Ecrites ici depuis l'ADR 021, et non plus sur `/gouvernance` sous une
 *  permission propre a la DSR : creer une structure ouvre son poste
 *  responsable, et c'est le meme administrateur qui pourvoit ce poste juste
 *  apres, dans l'onglet d'a cote.
 * ------------------------------------------------------------------ */

/**
 * Ce qui s'ecrit quand une structure entre a l'organigramme — F-01.
 *
 * **Aucun responsable ne s'y saisit.** Nommer quelqu'un a la tete d'une
 * structure passe par un *poste*, avec sa date d'effet et sa fin de mandat ;
 * le serveur ouvre donc, avec la structure, son poste responsable **vacant**.
 * Le schema serveur garde encore un champ `responsable` par compatibilite,
 * mais il n'est pas ecrit : l'envoyer d'ici aurait fait croire a une seconde
 * verite a cote de `poste`, et c'est elle qui aurait vieilli.
 */
export interface SaisieStructure {
  libelle: string;
  sigle: string;
  /** Direction, service, division, filiale ou succursale. */
  nature: string;
  /** Rang du niveau hierarchique. 1 = Direction generale. Qualifie, ne rattache pas. */
  niveau: number;
  /**
   * La structure mere dans l'organigramme — `null` au sommet.
   *
   * C'est lui qui rattache. Le serveur refuse un parent dont le rang n'est pas
   * strictement superieur, et un parent depourvu de poste responsable.
   */
  parentId: number | null;
  /**
   * Libelle du poste responsable ouvert avec la structure. Omis (`null`), le
   * serveur le compose depuis la nature et le sigle.
   */
  posteResponsableLibelle: string | null;
}

export function useCreerStructure() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: SaisieStructure) =>
      api.post<{ id: number }>("/organisation/structures", saisie),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: clesOrganisation.racine });
      // La structure neuve doit apparaitre dans tous les selecteurs, et son
      // poste responsable vacant dans le registre des postes.
      void client.invalidateQueries({ queryKey: ["referentiel"] });
    },
  });
}

/* ------------------------------------------------------------------ *
 *  Les postes de travail — F-03
 * ------------------------------------------------------------------ */

/**
 * Ouverture d'un poste.
 *
 * Un poste se cree **sans occupant** : c'est l'unite de la hierarchie, pas
 * l'agent. L'affectation vient apres, par `useAffecter`.
 *
 * `structureId` n'apparait qu'ici. Deplacer un poste d'une direction a une
 * autre n'est pas une correction mais une reorganisation : elle clot le poste
 * ici et en ouvre un la-bas. Le serveur refuse de le faire en une modification.
 */
export interface SaisiePoste {
  structureId: number;
  libelle: string;
  niveauId: number;
  posteSuperieurId: number | null;
  profilParDefautId: number | null;
  /** Combien d'agents le poste doit compter. L'ecart a cet effectif rend le
   *  poste vacant visible dans le tableau. */
  effectifPrevu: number;
}

/**
 * Correction d'un poste — `undefined` veut dire « ne touche pas ».
 *
 * `profilParDefautId` est omis, et non mis a `null`, quand l'administrateur
 * n'a pas `ADM_HAB` : il ne voit pas le catalogue des profils, et lui faire
 * envoyer `null` effacerait un choix qu'il n'a pas vu.
 */
export type SaisieModificationPoste = {
  libelle?: string;
  niveauId?: number;
  posteSuperieurId?: number | null;
  profilParDefautId?: number | null;
  effectifPrevu?: number;
};

/** Le motif est exige : une cloture sans raison est indistinguable d'une
 *  fausse manoeuvre six mois plus tard. */
export interface SaisieCloturePoste {
  motif: string;
}

/**
 * Creer un poste change l'organigramme **et** les selecteurs de poste des
 * autres ecrans (`referentiel/postes`, garde en cache une heure). Les deux
 * clefs sont invalidees ensemble, sans quoi le poste tout juste ouvert
 * resterait introuvable a l'affectation.
 */
function invaliderOrganigramme(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: clesOrganisation.racine });
  void client.invalidateQueries({ queryKey: ["referentiel"] });
}

export function useCreerPoste() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: SaisiePoste) => api.post<PosteTravail>("/organisation/postes", saisie),
    onSuccess: () => invaliderOrganigramme(client),
  });
}

export function useModifierPoste(posteId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: SaisieModificationPoste) =>
      api.patch<PosteTravail>(`/organisation/postes/${posteId}`, saisie),
    onSuccess: () => invaliderOrganigramme(client),
  });
}

/**
 * Fermer un poste. **Il n'y a pas de suppression**, cote serveur non plus :
 * effacer un poste effacerait qui a valide quoi a cet etage.
 */
export function useCloturerPoste(posteId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: SaisieCloturePoste) =>
      api.post<void>(`/organisation/postes/${posteId}/cloture`, saisie),
    onSuccess: () => invaliderOrganigramme(client),
  });
}

/* ------------------------------------------------------------------ *
 *  Les affectations — F-04
 * ------------------------------------------------------------------ */

/**
 * Affecter un agent a un poste.
 *
 * C'est aussi la **mutation** : le serveur clot l'occupation en cours la veille
 * du nouveau debut, dans la meme transaction. Deux occupations ne se
 * chevauchent donc jamais d'une journee — sur un poste de validation, une
 * journee a deux titulaires est une journee ou deux personnes ont pu signer au
 * meme titre.
 *
 * `debut` omis vaut aujourd'hui. Obliger a retaper la date du jour est le
 * meilleur moyen d'en obtenir une fausse.
 */
export interface SaisieAffectation {
  utilisateurId: number;
  posteId: number;
  debut: string | null;
  motif: string | null;
}

/** Fin d'occupation **sans suite** : depart, retraite, mise a disposition. Une
 *  mutation passe par `useAffecter`, qui enchaine les deux lignes. */
export interface SaisieFinAffectation {
  affectationId: number;
  fin: string | null;
  motif: string;
}

export function useAffecter() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: SaisieAffectation) =>
      api.post<Affectation>("/organisation/affectations", saisie),
    onSuccess: () => {
      invaliderOrganigramme(client);
      // Le compteur « titulaires / prevus » du tableau des postes bouge, et
      // l'annuaire des comptes affiche le poste de chaque agent.
      void client.invalidateQueries({ queryKey: ["habilitation"] });
    },
  });
}

export function useTerminerAffectation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (saisie: SaisieFinAffectation) =>
      api.post<Affectation>(`/organisation/affectations/${saisie.affectationId}/fin`, {
        fin: saisie.fin,
        motif: saisie.motif,
      }),
    onSuccess: () => {
      invaliderOrganigramme(client);
      void client.invalidateQueries({ queryKey: ["habilitation"] });
    },
  });
}
