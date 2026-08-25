import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Permission } from "@/types/habilitation";

/**
 * Domaine « habilitation ».
 *
 * Un profil est une liste de permissions, rien d'autre. Un perimetre dit sur
 * quelles donnees ces permissions s'exercent. La combinaison des deux remplace
 * ce qu'un autre logiciel appellerait un role — et c'est pour cela qu'aucun
 * nom de role n'existe dans le code.
 */
export interface Profil {
  id: number;
  /** Stable et non modifiable : c'est lui que le serveur cite dans ses refus. */
  code: string;
  libelle: string;
  description: string | null;
  nombreAgents: number;
  /** Un profil verrouille ne peut etre ni modifie ni supprime. */
  verrouille: boolean;
  permissions: Permission[];
}

export interface PerimetreAdmin {
  id: number;
  libelle: string;
  assise: string;
  etendue: string;
  nombreAgents: number;
  inclureDescendants: boolean;
  voirConfidentiel: boolean;
  lectureClotures: boolean;
  statistiquesAgregees: boolean;
}

export interface SessionCourrier {
  id: number;
  libelle: string;
  courriersEnCours: number;
  agents: { id: number; nomComplet: string; poste: string; rattacheLe: string }[];
}

export interface Delegation {
  id: number;
  titulaire: string;
  delegataire: string;
  poste: string;
  etendue: string;
  debut: string;
  fin: string;
  motif: string;
  etat: "active" | "programmee" | "close";
}

/**
 * Ce que la session peut déléguer, et à qui.
 *
 * Le serveur seul répond : il connaît le périmètre du titulaire et les postes
 * qui peuvent recevoir chacune de ses attributions. Le client n'énumère rien —
 * proposer ici un agent que le serveur refusera ensuite ne ferait que déplacer
 * le refus après la saisie.
 */
export interface DelegationPossible {
  delegataires: { id: number; nomComplet: string; poste: string }[];
  etendues: string[];
}

export interface SaisieDelegation {
  delegataireId: number;
  etendue: string;
  debut: string;
  fin: string;
  motif: string;
}

/**
 * Creation d'un profil — G-02.
 *
 * Les permissions n'y figurent **pas** : un profil nait vide ou copie. Le
 * serveur n'accepte pas de liste a la creation, et c'est cohérent avec l'ecran,
 * qui coche les permissions une a une dans le panneau de droite une fois le
 * profil cree.
 *
 * `depuisProfilId` copie les permissions d'un profil existant, y compris
 * verrouille : c'est la maniere prevue de partir d'un profil systeme sans le
 * modifier. La copie est faite une fois ; les deux profils divergent ensuite.
 */
export interface SaisieCreationProfil {
  /** Stable, non modifiable ensuite : le renommer casserait le semis. */
  code: string;
  libelle: string;
  description?: string | null;
  depuisProfilId?: number | null;
}

/** Le code n'y figure pas : il ne se renomme pas. */
export interface SaisieModificationProfil {
  libelle?: string;
  description?: string | null;
}

/** Le motif est exige : un profil retire sans raison ne se distingue pas d'une
 *  fausse manoeuvre. */
export interface SaisieInvalidationProfil {
  motif: string;
}

export const clesHabilitation = {
  racine: ["habilitation"] as const,
};

export interface Utilisateur {
  id: number;
  nomComplet: string;
  initiales: string;
  identifiant: string;
  structure: string;
  poste: string;
  profil: string;
  etat: "actif" | "suspendu" | "invite";
}

/**
 * Ce qui compose les droits d'un agent.
 *
 * Distinct d'`Utilisateur`, qui joint les profils en une chaîne pour le
 * registre : on ne retire pas un profil dont on n'a pas l'identifiant, ni ne
 * change une portée qu'on ne connaît pas. Le registre affiche, la fiche
 * administre.
 */
export interface FicheCompte {
  id: number;
  nomComplet: string;
  identifiant: string;
  courriel: string | null;
  telephone: string | null;
  matricule: string | null;
  structureId: number | null;
  structure: string;
  posteId: number | null;
  poste: string;
  etat: "actif" | "suspendu";
  /** Faux = le compte attend l'annuaire et ne peut pas ouvrir de session. */
  accesLocal: boolean;
  profils: { id: number; libelle: string; verrouille: boolean }[];
  /** Absent = l'agent ne voit rien. */
  perimetre: {
    portee: string;
    libelle: string;
    structureId: number | null;
    structure: string | null;
  } | null;
  sessionCourrier: string | null;
}

export const ficheCompteQuery = (utilisateurId: number | null) =>
  queryOptions({
    queryKey: ["habilitation", "utilisateurs", "fiche", utilisateurId],
    queryFn: ({ signal }) =>
      api.get<FicheCompte>(`/habilitations/utilisateurs/${utilisateurId}`, signal),
    enabled: utilisateurId !== null,
  });

export const utilisateursQuery = (vue: string) =>
  queryOptions({
    queryKey: ["habilitation", "utilisateurs", vue],
    queryFn: ({ signal }) => api.get<Utilisateur[]>(`/habilitations/utilisateurs?vue=${vue}`, signal),
    placeholderData: (precedent) => precedent,
  });

export const profilsQuery = () =>
  queryOptions({
    queryKey: ["habilitation", "profils"],
    queryFn: ({ signal }) => api.get<Profil[]>("/habilitations/profils", signal),
  });

export const perimetresQuery = () =>
  queryOptions({
    queryKey: ["habilitation", "perimetres"],
    queryFn: ({ signal }) => api.get<PerimetreAdmin[]>("/habilitations/perimetres", signal),
  });

export const sessionsQuery = () =>
  queryOptions({
    queryKey: ["habilitation", "sessions"],
    queryFn: ({ signal }) => api.get<SessionCourrier[]>("/habilitations/sessions", signal),
  });

export const delegationsQuery = () =>
  queryOptions({
    queryKey: ["habilitation", "delegations"],
    queryFn: ({ signal }) => api.get<Delegation[]>("/habilitations/delegations", signal),
  });

/**
 * Les délégations de la session elle-même — celles qu'elle a posées.
 *
 * Distinct de `delegationsQuery`, qui montre l'ensemble à l'administrateur. Un
 * responsable pose et retire les siennes sans avoir à demander à quiconque
 * (§3.4) ; il n'a pas pour autant à voir celles des autres.
 */
export const mesDelegationsQuery = () =>
  queryOptions({
    queryKey: ["habilitation", "delegations", "miennes"],
    queryFn: ({ signal }) => api.get<Delegation[]>("/habilitations/delegations/miennes", signal),
  });

export const delegationPossibleQuery = () =>
  queryOptions({
    queryKey: ["habilitation", "delegations", "possible"],
    queryFn: ({ signal }) =>
      api.get<DelegationPossible>("/habilitations/delegations/possible", signal),
  });

export function useDeclarerDelegation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: SaisieDelegation) =>
      api.post<Delegation>("/habilitations/delegations", corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesHabilitation.racine });
    },
  });
}

/**
 * Interrompre une délégation avant son terme.
 *
 * Indispensable, et non un confort : une absence écourtée laisserait sinon un
 * agent signer au nom d'un autre revenu à son poste. La délégation n'est pas
 * effacée — elle est close, et reste au registre de l'administrateur.
 */
export function useInterrompreDelegation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/habilitations/delegations/${id}`),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesHabilitation.racine });
    },
  });
}

/**
 * La création d'un compte.
 *
 * `profilId` et `portee` ne sont pas optionnels côté serveur, et c'est
 * volontaire : un compte sans profil ne peut rien, un compte sans périmètre ne
 * voit rien. Le formulaire les impose donc aussi — proposer une création « nue »
 * produirait un agent qui se connecte et n'obtient que des listes vides.
 *
 * `motDePasse` est provisoire : l'authentification doit revenir à l'annuaire
 * (RF-ADM-02). Omis, le compte existe et attend le SSO.
 */
export interface SaisieCompte {
  identifiant: string;
  prenom: string;
  nom: string;
  structureId: number;
  posteId: number;
  profilId: number;
  portee: string;
  perimetreStructureId?: number | null;
  courriel?: string | null;
  telephone?: string | null;
  matricule?: string | null;
  motDePasse?: string | null;
}

export interface SaisieModificationCompte {
  prenom?: string;
  nom?: string;
  courriel?: string;
  telephone?: string;
  structureId?: number;
  posteId?: number;
}

/**
 * Les quatre portées, dans l'ordre où l'écran les propose.
 *
 * La liste est **fermée** et vient du référentiel serveur : elle n'est pas un
 * paramétrage. Les libellés sont ceux de `PORTEE_VERS_FRONT`, la table de
 * correspondance unique entre le vocabulaire de la base et celui des écrans.
 */
export const PORTEES: readonly { valeur: string; libelle: string; aide: string }[] = [
  { valeur: "propre", libelle: "Poste", aide: "Ce que l'agent traite lui-même." },
  { valeur: "structure", libelle: "Structure", aide: "Sa structure, sans les descendantes." },
  {
    valeur: "sous_arbre",
    libelle: "Structure et descendantes",
    aide: "Sa structure et tout ce qui en dépend.",
  },
  { valeur: "toutes", libelle: "Institution", aide: "Tout, sans restriction de périmètre." },
];

function invalider(client: ReturnType<typeof useQueryClient>) {
  client.invalidateQueries({ queryKey: clesHabilitation.racine });
}

export function useCreerCompte() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: SaisieCompte) => api.post<Utilisateur>("/habilitations/utilisateurs", corps),
    onSuccess: () => invalider(client),
  });
}

export function useModifierCompte(utilisateurId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: SaisieModificationCompte) =>
      api.patch<Utilisateur>(`/habilitations/utilisateurs/${utilisateurId}`, corps),
    onSuccess: () => invalider(client),
  });
}

/**
 * Suspendre un compte, ou le rétablir.
 *
 * Il n'existe pas de suppression, et ce n'est pas un oubli : effacer un compte
 * effacerait qui a signé quoi.
 */
export function useChangerEtatCompte(utilisateurId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (actif: boolean) =>
      api.patch<Utilisateur>(`/habilitations/utilisateurs/${utilisateurId}/etat`, { actif }),
    onSuccess: () => invalider(client),
  });
}

/** Un agent peut porter plusieurs profils : attribuer ajoute, n'écrase pas. */
export function useAttribuerProfil(utilisateurId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (profilId: number) =>
      api.post<void>(`/habilitations/utilisateurs/${utilisateurId}/profils`, { profilId }),
    onSuccess: () => invalider(client),
  });
}

export function useRetirerProfil(utilisateurId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (profilId: number) =>
      api.delete<void>(`/habilitations/utilisateurs/${utilisateurId}/profils/${profilId}`),
    onSuccess: () => invalider(client),
  });
}

/**
 * Poser la portée d'un agent.
 *
 * L'ancien périmètre n'est pas modifié mais clos, et un nouveau ouvert : savoir
 * ce qu'un agent avait le droit de voir le mois dernier fait partie de ce que
 * l'audit demande.
 */
export function useDefinirPerimetre(utilisateurId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { portee: string; structureId: number | null }) =>
      api.patch<void>(`/habilitations/utilisateurs/${utilisateurId}/perimetre`, corps),
    onSuccess: () => invalider(client),
  });
}

export function useRattacherAgent(sessionId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (utilisateurId: number) =>
      api.post<void>(`/habilitations/sessions/${sessionId}/agents`, { utilisateurId }),
    onSuccess: () => invalider(client),
  });
}

export function useDetacherAgent(sessionId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (utilisateurId: number) =>
      api.delete<void>(`/habilitations/sessions/${sessionId}/agents/${utilisateurId}`),
    onSuccess: () => invalider(client),
  });
}

export function useCreerProfil() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: SaisieCreationProfil) => api.post<Profil>("/habilitations/profils", corps),
    onSuccess: () => invalider(client),
  });
}

export function useModifierProfil(profilId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: SaisieModificationProfil) =>
      api.patch<Profil>(`/habilitations/profils/${profilId}`, corps),
    onSuccess: () => invalider(client),
  });
}

/**
 * Retirer un profil du catalogue.
 *
 * Ce n'est pas une suppression : les agents qui l'ont porte gardent leur
 * historique, et le journal continue de citer le profil sous lequel une
 * decision a ete prise. Le serveur refuse d'invalider un profil verrouille, et
 * refuse aussi de laisser des agents sans aucun profil.
 */
export function useInvaliderProfil(profilId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: SaisieInvalidationProfil) =>
      api.post<void>(`/habilitations/profils/${profilId}/invalidation`, corps),
    onSuccess: () => invalider(client),
  });
}

export function useBasculerPermission(profilId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (corps: { permission: Permission; accordee: boolean }) =>
      api.patch<void>(`/habilitations/profils/${profilId}/permissions`, corps),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: clesHabilitation.racine });
    },
  });
}
