import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Referentiels partages.
 *
 * Natures, correspondants, structures et mentions types sont administres dans
 * le domaine « parametrage » mais consommes par tous les autres. Ils vivent
 * donc dans `lib`, pour qu'aucune fonctionnalite n'ait a en importer une autre.
 */

export interface Nature {
  id: number;
  libelle: string;
  /** Delai propose a l'enregistrement, en jours ouvres. */
  delaiParDefaut: number | null;
}

export interface Correspondant {
  id: number;
  libelle: string;
  /** « Institution », « Entreprise », « Usager »… */
  categorie: string;
  initiales: string;
  nombreCourriers: number;
  dernierCourrier: string | null;
}

/**
 * Ce qu'est la structure au regard du droit, et non de l'organigramme.
 *
 * La distinction compte : une filiale a ses propres organes de gestion, dont
 * la DSR suit les sessions et les prescriptions (§3.3). Une direction n'en a
 * pas — elle relève des instances du Port autonome lui-meme.
 */
export type NatureStructure = "Direction" | "Service" | "Division" | "Filiale" | "Succursale";

export interface StructureRef {
  id: number;
  libelle: string;
  sigle: string;
  nature: NatureStructure;
  /** Rang du niveau hierarchique. 1 = Direction Generale. Indente, ne rattache pas. */
  niveau: number;
  /**
   * La structure de rattachement — `null` au sommet.
   *
   * C'est ce champ, et non `niveau`, qui fait l'organigramme : deux directions
   * de rang 2 rattachees a deux directions differentes ont le meme rang et ne
   * sont pas soeurs. Voir `construireArbre()`.
   */
  parentId: number | null;
  /** Aide a la decision au moment de coter : qui repond, et en combien de temps. */
  responsable: string | null;
  delaiMoyenJours: number | null;
  courriersEnCours: number;
}

export interface MentionType {
  id: number;
  libelle: string;
}

/** Les referentiels changent rarement : une heure de cache evite des allers-retours. */
const DUREE = 60 * 60 * 1000;

export const naturesQuery = () =>
  queryOptions({
    queryKey: ["referentiel", "natures"],
    queryFn: ({ signal }) => api.get<Nature[]>("/referentiels/natures", signal),
    staleTime: DUREE,
  });

export const structuresQuery = () =>
  queryOptions({
    queryKey: ["referentiel", "structures"],
    queryFn: ({ signal }) => api.get<StructureRef[]>("/referentiels/structures", signal),
    staleTime: DUREE,
  });

/**
 * Un agent actif, tel que le rend l'annuaire des selecteurs.
 *
 * Trois champs et pas un de plus : l'annuaire est lu sans perimetre (ADR 020),
 * donc visible de toute session. `poste` et `structure` sont la pour departager
 * deux homonymes a l'oeil — ce que le serveur, lui, fait par `id`.
 */
export interface AgentRef {
  id: number;
  nomComplet: string;
  /** Vide pour un compte sans poste : il reste designable. */
  poste: string;
  /** Le sigle de la structure. */
  structure: string;
  structureId: number | null;
}

/**
 * L'annuaire des agents actifs.
 *
 * Non filtre par defaut, et c'est voulu : un point focal inscrit les activites
 * de toute sa direction et doit pouvoir en designer le responsable, y compris
 * son propre directeur, qui releve d'une structure superieure a la sienne.
 */
export const agentsQuery = (structureId?: number | null) =>
  queryOptions({
    queryKey: ["referentiel", "agents", structureId ?? null],
    queryFn: ({ signal }) =>
      api.get<AgentRef[]>(
        structureId ? `/referentiels/agents?structureId=${structureId}` : "/referentiels/agents",
        signal,
      ),
    staleTime: DUREE,
  });

/**
 * Un poste en vigueur.
 *
 * Ne sert qu'a l'administration des comptes, mais lui est indispensable :
 * `POST /habilitations/utilisateurs` exige un `posteId`, et le serveur refuse
 * un poste qui ne releve pas de la structure choisie.
 */
export interface PosteRef {
  id: number;
  libelle: string;
  structureId: number;
  /** Le sigle de la structure — deux directions ont des postes homonymes. */
  structure: string;
  niveau: number;
  /**
   * Le poste au-dessus, jamais l'agent au-dessus.
   *
   * Peut pointer hors de la liste quand celle-ci est filtree par structure :
   * le superieur d'un directeur est le Directeur general, qui releve d'une
   * autre structure.
   */
  posteSuperieurId: number | null;
}

/**
 * Les postes d'une structure.
 *
 * Toujours filtres : la liste complete melerait huit « Chef de service » que
 * rien ne distinguerait dans un selecteur. `structureId` absent desactive la
 * requete plutot que de tout charger.
 */
export const postesQuery = (structureId: number | null) =>
  queryOptions({
    queryKey: ["referentiel", "postes", structureId],
    queryFn: ({ signal }) =>
      api.get<PosteRef[]>(`/referentiels/postes?structureId=${structureId}`, signal),
    enabled: structureId !== null,
    staleTime: DUREE,
  });

/**
 * Une structure et sa place dans l'arbre.
 *
 * `profondeur` est calculee en remontant les parents, et ne vaut pas `niveau` :
 * un service rattache directement a la Direction generale est de rang 3 et de
 * profondeur 1. C'est la profondeur qui indente, le rang qui qualifie.
 */
export interface NoeudStructure {
  structure: StructureRef;
  profondeur: number;
  /** Le parent designe existe-t-il dans la liste ? Voir `construireArbre()`. */
  orpheline: boolean;
}

/**
 * Met les structures a plat dans l'ordre de l'arbre, chacune avec sa profondeur.
 *
 * Un parcours en profondeur, et non un tri : c'est ce qui fait qu'une direction
 * est immediatement suivie de ses services plutot que de la direction suivante.
 * Les rendre en liste plate plutot qu'en arbre imbrique permet a l'appelant de
 * les poser dans un tableau sans les aplatir de nouveau.
 *
 * **Les orphelines remontent a la racine et sont marquees.** Une structure en
 * vigueur dont le parent ne l'est plus existe (voir la docstring cote serveur) :
 * la taire l'aurait fait disparaitre de l'ecran, la fondre dans la racine sans
 * le dire en aurait fait une fausse direction. Elle est donc affichee, et
 * signalee comme telle.
 *
 * Les cycles ne sont pas possibles au socle (`parent_id` refuse la
 * reflexivite), mais la boucle est bornee par le lot visite : une reference
 * circulaire arrivee par migration ferait tourner la page a l'infini, ce qui
 * est le seul defaut qu'un utilisateur ne peut pas contourner.
 */
export function construireArbre(structures: readonly StructureRef[]): NoeudStructure[] {
  const parIdentifiant = new Map(structures.map((s) => [s.id, s]));
  const enfants = new Map<number | null, StructureRef[]>();

  for (const structure of structures) {
    // Une structure dont le parent n'est pas du lot est traitee comme une
    // racine, mais on garde de quoi le dire a l'ecran.
    const rattachement =
      structure.parentId !== null && parIdentifiant.has(structure.parentId)
        ? structure.parentId
        : null;
    const fratrie = enfants.get(rattachement);
    if (fratrie) fratrie.push(structure);
    else enfants.set(rattachement, [structure]);
  }

  const noeuds: NoeudStructure[] = [];
  const visitees = new Set<number>();

  function descendre(parent: number | null, profondeur: number) {
    for (const structure of enfants.get(parent) ?? []) {
      if (visitees.has(structure.id)) continue;
      visitees.add(structure.id);
      noeuds.push({
        structure,
        profondeur,
        orpheline: parent === null && structure.parentId !== null,
      });
      descendre(structure.id, profondeur + 1);
    }
  }

  descendre(null, 0);
  return noeuds;
}

export const mentionsQuery = () =>
  queryOptions({
    queryKey: ["referentiel", "mentions"],
    queryFn: ({ signal }) => api.get<MentionType[]>("/referentiels/mentions", signal),
    staleTime: DUREE,
  });

export const correspondantsQuery = (recherche: string) =>
  queryOptions({
    queryKey: ["referentiel", "correspondants", recherche],
    queryFn: ({ signal }) =>
      api.get<Correspondant[]>(
        `/referentiels/correspondants?q=${encodeURIComponent(recherche)}`,
        signal,
      ),
    // Le referentiel des correspondants est vaste : on n'interroge qu'a partir
    // de deux caracteres, sinon la premiere frappe ramenerait tout.
    enabled: recherche.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });
