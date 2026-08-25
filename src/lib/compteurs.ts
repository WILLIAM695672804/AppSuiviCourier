import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CleCompteur } from "@/lib/navigation";

type Compteurs = Record<CleCompteur, number>;

const VIDE: Compteurs = { courriers: 0, cotations: 0, relances: 0 };

/**
 * La route est-elle livree ? **Oui, depuis le 17 aout 2026.**
 *
 * `GET /compteurs` a longtemps repondu 404 : les trois chiffres portent sur le
 * pilier courrier, qui n'etait pas livre. L'appel partait a chaque montage de la
 * barre laterale — donc a chaque chargement de l'application — et revenait en
 * 404, deux fois par montage avec le `retry: 1` global.
 *
 * La constante avait ete posee pour que le branchement ne coute qu'une ligne. Il
 * n'a coute qu'une ligne.
 */
const ROUTE_LIVREE = true;

/**
 * Pastilles du menu.
 *
 * Un seul appel pour toute la barre laterale : trois requetes separees
 * feraient clignoter le menu a chaque navigation. Le serveur borne deja
 * ces chiffres au perimetre de l'agent.
 *
 * `VIDE` sert le temps du chargement et le cas d'erreur — la barre masque les
 * pastilles a zero. **Ne pas remplacer ce zero par une valeur plausible** :
 * « 0 relance » se lit « rien a relancer », ce qu'un compteur qui n'a pas
 * repondu ne dit pas (ADR 011 — on rend ce qu'on mesure, on nomme le reste).
 */
export function useCompteurs(): Compteurs {
  const { data } = useQuery({
    queryKey: ["compteurs"],
    queryFn: () => api.get<Compteurs>("/compteurs"),
    staleTime: 60 * 1000,
    enabled: ROUTE_LIVREE,
  });

  return data ?? VIDE;
}
