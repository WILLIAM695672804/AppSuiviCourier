import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Domaine « portail » — l'espace des usagers, entreprises et administrations.
 *
 * Le §3.13 lui donne trois capacités : déposer une demande et suivre son
 * avancement, recevoir des notifications multicanal, et échanger de façon
 * dématérialisée dans le cadre de marchés publics, conventions ou reportings.
 *
 * Le principe qui gouverne tout ce domaine : **l'usager ne voit que ce qui le
 * concerne**. Aucun écran ne porte de sélecteur de périmètre, aucune liste ne
 * comporte de filtre par structure, et le serveur ne renvoie jamais un objet
 * qui ne lui appartient pas. C'est la contrepartie de l'ouverture au public :
 * un portail qui laisserait deviner l'existence d'autres dossiers serait une
 * fuite, quand bien même il n'en montrerait pas le contenu.
 *
 * Le vocabulaire change aussi. On ne parle pas de « cotation », d'« étape » ni
 * de « structure pilote » : ce sont des mots de l'institution. L'usager lit
 * « votre demande est à l'étude au service juridique ».
 */

export type EtatDemandeUsager =
  | "Déposée"
  | "À l'étude"
  | "Complément attendu"
  | "Décision rendue"
  | "Close";

export interface DemandeUsager {
  id: number;
  reference: string;
  objet: string;
  type: string;
  deposeeLe: string;
  /** Ce que l'institution s'engage à tenir, en clair. */
  reponseAttendueLe: string;
  etat: EtatDemandeUsager;
  /** Vrai quand le portail attend quelque chose de l'usager. */
  actionAttendue: boolean;
  serviceInstructeur: string;
}

export interface EtapeUsager {
  libelle: string;
  franchie: boolean;
  date: string | null;
  /** Formulée pour l'usager, jamais dans le vocabulaire de l'institution. */
  explication: string;
}

export interface MessagePortail {
  id: number;
  auteur: "Institution" | "Vous";
  nom: string;
  date: string;
  texte: string;
  pieces: { nom: string; taille: string }[];
}

export interface DemandeUsagerDetail extends DemandeUsager {
  contexte: string;
  etapes: EtapeUsager[];
  messages: MessagePortail[];
  pieces: { id: number; nom: string; taille: string; deposeeLe: string; parVous: boolean }[];
  /** Complément réclamé, avec sa date limite. `null` si rien n'est attendu. */
  complementAttendu: { objet: string; avantLe: string } | null;
}

export type CanalNotification = "Courriel" | "SMS" | "Portail seulement";

export interface Preferences {
  courriel: string;
  telephone: string | null;
  canal: CanalNotification;
  /** Événements pour lesquels l'usager veut être prévenu. */
  evenements: { cle: string; libelle: string; actif: boolean }[];
}

export type NatureEchange = "Marché public" | "Convention" | "Reporting réglementaire";

export interface Echange {
  id: number;
  reference: string;
  intitule: string;
  nature: NatureEchange;
  ouvertLe: string;
  echeance: string | null;
  /** Ce que l'usager doit déposer, et ce qu'il a déjà déposé. */
  attendus: number;
  deposes: number;
  etat: "Ouvert" | "Clos" | "En attente de votre dépôt";
}

const CLE = "portail";

export const mesDemandesQuery = () =>
  queryOptions({
    queryKey: [CLE, "demandes"],
    queryFn: ({ signal }) =>
      api.get<{ demandes: DemandeUsager[]; identite: string }>("/portail/demandes", signal),
  });

export const demandeQuery = (id: number) =>
  queryOptions({
    queryKey: [CLE, "demande", id],
    queryFn: ({ signal }) => api.get<DemandeUsagerDetail>(`/portail/demandes/${id}`, signal),
  });

export const preferencesQuery = () =>
  queryOptions({
    queryKey: [CLE, "preferences"],
    queryFn: ({ signal }) => api.get<Preferences>("/portail/preferences", signal),
  });

export const echangesQuery = () =>
  queryOptions({
    queryKey: [CLE, "echanges"],
    queryFn: ({ signal }) => api.get<{ echanges: Echange[] }>("/portail/echanges", signal),
  });

/* ------------------------------------------------------------------ *
 *  Ecritures
 * ------------------------------------------------------------------ */

export interface SaisieDemandeUsager {
  type: string;
  objet: string;
  contexte: string;
  pieces: { nom: string; taille: string }[];
}

export interface SaisieMessage {
  demandeId: number;
  texte: string;
  pieces: { nom: string; taille: string }[];
}

export interface SaisiePreferences {
  courriel: string;
  telephone: string | null;
  canal: CanalNotification;
  evenements: string[];
}

function useEcriture<TCorps>(chemin: string | ((corps: TCorps) => string)) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (corps: TCorps) =>
      api.post<{ id: number }>(typeof chemin === "function" ? chemin(corps) : chemin, corps),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [CLE] });
    },
  });
}

export const useDeposerDemande = () => useEcriture<SaisieDemandeUsager>("/portail/demandes");

export const useRepondre = () =>
  useEcriture<SaisieMessage>((corps) => `/portail/demandes/${corps.demandeId}/messages`);

export const useEnregistrerPreferences = () =>
  useEcriture<SaisiePreferences>("/portail/preferences");
