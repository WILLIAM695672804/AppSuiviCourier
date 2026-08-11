import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CleCompteur } from "@/lib/navigation";

type Compteurs = Record<CleCompteur, number>;

const VIDE: Compteurs = { courriers: 0, cotations: 0, relances: 0 };

/**
 * Pastilles du menu.
 *
 * Un seul appel pour toute la barre laterale : trois requetes separees
 * feraient clignoter le menu a chaque navigation. Le serveur borne deja
 * ces chiffres au perimetre de l'agent.
 */
export function useCompteurs(): Compteurs {
  const { data } = useQuery({
    queryKey: ["compteurs"],
    queryFn: () => api.get<Compteurs>("/compteurs"),
    staleTime: 60 * 1000,
  });

  return data ?? VIDE;
}
