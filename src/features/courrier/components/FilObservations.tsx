import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { useSession } from "@/lib/contexteSession";
import { formaterDateHeure } from "@/lib/format";
import type { Observation } from "@/types/courrier";

/**
 * Instructions et observations portees au courrier.
 *
 * Ces messages ne sont pas une messagerie : ils sont attaches au courrier,
 * horodates et non modifiables. C'est ce qui remplace l'annotation manuscrite
 * en marge du parapheur — d'ou l'absence de bouton « modifier ».
 */
export function FilObservations({
  observations,
  onPublier,
  peutEcrire,
}: {
  observations: Observation[];
  onPublier?: (texte: string) => void;
  peutEcrire: boolean;
}) {
  const session = useSession();
  const [texte, setTexte] = useState("");

  function publier() {
    const propre = texte.trim();
    if (!propre) return;
    onPublier?.(propre);
    setTexte("");
  }

  return (
    <div className="mt-[15px] flex flex-col gap-3.5">
      {observations.map((observation) => (
        <article key={observation.id} className="flex gap-[11px]">
          <Avatar initiales={observation.initiales} titre={observation.auteur} />
          <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs leading-none font-bold text-encre">{observation.auteur}</span>
              <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                {observation.fonction} · {formaterDateHeure(observation.horodatage)}
              </span>
            </div>
            <p className="text-xs leading-[1.6] font-medium text-pretty text-encre-moyenne">
              {observation.texte}
            </p>
          </div>
        </article>
      ))}

      {observations.length === 0 && (
        <p className="text-[12.5px] font-medium text-encre-tenue">
          Aucune observation portée à ce courrier.
        </p>
      )}

      {peutEcrire && (
        <div className="flex items-center gap-[11px] border-t border-separateur pt-3.5">
          <Avatar initiales={session.initiales} titre={session.nomComplet} />
          <input
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") publier();
            }}
            placeholder="Ajouter une observation…"
            className="min-w-0 flex-1 rounded-none border border-bordure-forte px-3 py-2.5 text-xs leading-none font-medium text-encre outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
          />
          <Bouton variante="doux" onClick={publier} disabled={!texte.trim()}>
            Publier
          </Bouton>
        </div>
      )}
    </div>
  );
}
