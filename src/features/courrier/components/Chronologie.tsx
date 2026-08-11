import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { formaterDateHeure } from "@/lib/format";
import type { EtapeChronologie } from "@/types/courrier";

/**
 * Circuit parcouru par le courrier.
 *
 * C'est la reponse a la seule question que pose un agent devant une fiche :
 * ou en est-on, et qui a fait quoi. L'instruction portee a une etape est
 * citee sous elle, en retrait — elle engage son auteur.
 */
function Pastille({ etat }: { etat: EtapeChronologie["etat"] }) {
  if (etat === "faite") {
    return (
      <span className="grid size-7 place-items-center rounded-none bg-[#e7f8f0] text-succes">
        <Icone nom="coche" taille={14} epaisseur={2} />
      </span>
    );
  }

  if (etat === "courante") {
    return (
      <span className="grid size-7 place-items-center rounded-none bg-accent text-white shadow-[0_0_0_4px_var(--color-accent-voile)]">
        <Icone nom="horloge" taille={13} epaisseur={1.8} />
      </span>
    );
  }

  return <span className="size-7 rounded-none border-[1.5px] border-dashed border-bordure-champ" />;
}

export function Chronologie({ etapes }: { etapes: EtapeChronologie[] }) {
  if (etapes.length === 0) {
    return (
      <p className="mt-4 text-[12.5px] font-medium text-encre-tenue">
        Le circuit n'a pas encore commencé.
      </p>
    );
  }

  return (
    <ol className="mt-4">
      {etapes.map((etape, i) => {
        const derniere = i === etapes.length - 1;

        return (
          <li key={etape.id} className="grid grid-cols-[30px_minmax(0,1fr)] gap-3.5">
            <div className="flex flex-col items-center gap-1">
              <Pastille etat={etape.etat} />
              {!derniere && <div className="w-[1.5px] flex-1 bg-bordure" />}
            </div>

            <div className={`flex flex-col gap-2 ${derniere ? "pb-4" : "pb-[18px]"}`}>
              <div className="flex flex-wrap items-center gap-[9px]">
                <span className="text-[12.5px] leading-none font-bold text-encre">
                  {etape.libelle}
                </span>
                {etape.etat === "courante" ? (
                  <Etiquette ton="accent">Étape courante</Etiquette>
                ) : (
                  <span className="text-[11px] leading-none font-medium text-encre-tenue">
                    {formaterDateHeure(etape.horodatage)}
                  </span>
                )}
              </div>

              {(etape.auteur || etape.precision) && (
                <span className="text-[11.5px] leading-[1.5] font-medium text-encre-faible">
                  {[etape.auteur, etape.precision].filter(Boolean).join(" · ")}
                </span>
              )}

              {etape.instruction && (
                <blockquote className="border-l-2 border-bordure pl-3">
                  <p className="text-xs leading-[1.6] font-medium text-pretty text-encre-moyenne">
                    {etape.instruction}
                  </p>
                </blockquote>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
