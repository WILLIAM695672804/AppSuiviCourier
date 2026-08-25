import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Domaine « notifications ».
 *
 * **Deux lectures qui n'ont rien a voir.** « Mes notifications » est adressee a
 * une personne : aucune permission ne la garde, le filtre est le destinataire
 * (ADR 013, meme principe que le portail). « L'etat de la file » est de
 * l'exploitation et exige `ADM_PAR`.
 *
 * Ce que l'ecran doit rendre visible, et qui n'est pas un detail technique : un
 * envoi `sans_transport` **n'est pas un echec**. C'est un canal que
 * l'institution n'a pas branche — la messagerie (A51) et la passerelle SMS
 * (A48). Les confondre ferait chercher un incident la ou il n'y a qu'une
 * decision en attente.
 */
export type ImportanceNotification = "information" | "alerte";

export interface Notification {
  id: number;
  type: string;
  libelle: string;
  detail: string;
  importance: ImportanceNotification;
  /** Chemin du front (`/dossiers/42`), jamais une URL absolue. */
  lien: string | null;
  lue: boolean;
  creeLe: string;
}

export interface MesNotifications {
  /** Compte sur toute la table, pas sur la page rendue. */
  nonLues: number;
  notifications: Notification[];
}

export type EtatEnvoi = "en_attente" | "envoye" | "echoue" | "sans_transport";

export interface LigneCanal {
  canal: string;
  enAttente: number;
  envoyes: number;
  echoues: number;
  sansTransport: number;
}

export interface EnvoiBloque {
  id: number;
  canal: string;
  etat: EtatEnvoi;
  libelle: string;
  tentatives: number;
  raison: string;
  creeLe: string;
}

export interface EtatFile {
  canaux: LigneCanal[];
  enAttente: number;
  bloques: EnvoiBloque[];
}

export function mesNotificationsQuery() {
  return queryOptions({
    queryKey: ["notifications"],
    queryFn: ({ signal }) => api.get<MesNotifications>("/notifications", signal),
  });
}

export function etatFileQuery() {
  return queryOptions({
    queryKey: ["notifications", "file"],
    queryFn: ({ signal }) => api.get<EtatFile>("/notifications/file", signal),
  });
}

export function useMarquerLue() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<Notification>(`/notifications/${id}/lecture`),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/** Solde la pastille. Les notifications restent lisibles — elles ne disparaissent pas. */
export function useToutMarquerLu() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ marquees: number }>("/notifications/lecture"),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
