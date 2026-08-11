import { Icone } from "@/components/ui/Icone";
import type { Visa } from "@/types/depart";

/**
 * Chaine de visas d'un projet de reponse.
 *
 * Chaque pastille est un viseur, dans l'ordre. Le renvoi se distingue du visa
 * manquant : un projet renvoye n'attend pas, il est revenu — et c'est ce que
 * le redacteur doit voir en un coup d'oeil dans le registre.
 */
export function ChaineVisas({ visas }: { visas: Visa[] }) {
  const donnes = visas.filter((v) => v.viseLe).length;

  return (
    <span className="flex items-center gap-1.5" title={decrire(visas)}>
      <span className="flex items-center gap-[3px]">
        {visas.map((visa) => (
          <span
            key={visa.ordre}
            className={`grid size-[18px] place-items-center rounded-none text-[8px] leading-none font-bold ${
              visa.renvoye
                ? "bg-danger-voile text-danger"
                : visa.viseLe
                  ? "bg-[#e7f8f0] text-succes"
                  : "border border-dashed border-bordure-champ text-encre-tenue"
            }`}
          >
            {visa.renvoye ? <Icone nom="croix" taille={9} epaisseur={2} /> : visa.initiales.slice(0, 2)}
          </span>
        ))}
      </span>
      <span className="text-[11px] leading-none font-medium text-encre-faible tabular-nums">
        {donnes}/{visas.length}
      </span>
    </span>
  );
}

function decrire(visas: Visa[]): string {
  return visas
    .map((v) =>
      v.renvoye
        ? `${v.nomComplet} — renvoyé${v.motifRenvoi ? ` : ${v.motifRenvoi}` : ""}`
        : v.viseLe
          ? `${v.nomComplet} — visé`
          : `${v.nomComplet} — en attente`,
    )
    .join("\n");
}
