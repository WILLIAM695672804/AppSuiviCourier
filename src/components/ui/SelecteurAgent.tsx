import { useQuery } from "@tanstack/react-query";
import { type SelectHTMLAttributes } from "react";
import { Liste } from "@/components/ui/Champ";
import { agentsQuery, type AgentRef } from "@/lib/referentiel";

/**
 * Choix d'un agent dans l'annuaire.
 *
 * Remplace les champs libres où l'on tapait un nom. Le serveur comparait la
 * saisie au nom complet **caractère par caractère** et refusait tout le reste
 * en 409 : « S. Bamba », le placeholder du champ, ne correspondait à aucun
 * compte. Voir l'ADR 020, et `docs/pieges.md`.
 *
 * Ce qui circule est l'**identifiant**, pas le nom. C'est ce qui règle le cas
 * des homonymes : deux agents peuvent porter le même nom complet, jamais le
 * même identifiant, et le serveur n'a plus à refuser une désignation ambiguë
 * que rien ne pouvait lever.
 *
 * Une `Liste` native et non une liste déroulante maison : les formulaires sont
 * denses, le clavier et le tactile la connaissent, et la recherche par frappe
 * y est déjà. Le jour où l'annuaire dépassera quelques centaines d'agents,
 * c'est le composant à reprendre — pas les écrans qui l'appellent.
 */
export function SelecteurAgent({
  libelle,
  erreur,
  aide,
  invite = "Choisir un agent…",
  /** Borne la liste à une structure. Absent, l'annuaire entier est proposé. */
  structureId,
  ...reste
}: SelectHTMLAttributes<HTMLSelectElement> & {
  libelle: string;
  erreur?: string;
  aide?: string;
  invite?: string;
  structureId?: number | null;
}) {
  const { data, isPending, isError } = useQuery(agentsQuery(structureId));

  return (
    <Liste
      libelle={libelle}
      erreur={erreur}
      aide={
        isError
          ? "L'annuaire n'a pas pu être chargé. Rechargez la page avant de valider."
          : aide
      }
      invite={isPending ? "Chargement de l'annuaire…" : invite}
      options={(data ?? []).map((agent) => ({
        valeur: String(agent.id),
        libelle: etiquette(agent),
      }))}
      disabled={isPending || isError}
      {...reste}
    />
  );
}

/**
 * « Yves Manga — Point focal (DSI) ».
 *
 * Le poste et le sigle ne sont pas décoratifs : ils départagent deux homonymes
 * à l'œil. Ils sont omis quand ils manquent plutôt que rendus vides — un
 * compte sans poste reste désignable, il ne doit pas s'afficher comme « — ( ) ».
 */
function etiquette(agent: AgentRef): string {
  const qualite = [agent.poste, agent.structure && `(${agent.structure})`]
    .filter(Boolean)
    .join(" ");
  return qualite ? `${agent.nomComplet} — ${qualite}` : agent.nomComplet;
}
