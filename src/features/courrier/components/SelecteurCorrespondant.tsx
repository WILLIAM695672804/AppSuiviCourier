import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChampRecherche } from "@/components/ui/ChampRecherche";
import { formaterDate } from "@/lib/format";
import { correspondantsQuery, type Correspondant } from "@/lib/referentiel";
import { useValeurDifferee } from "@/lib/useValeurDifferee";

/**
 * Choix de l'expediteur dans le referentiel des correspondants.
 *
 * On ne saisit jamais un expediteur au clavier : c'est ainsi qu'un meme
 * ministere finit ecrit de six manieres et que les statistiques deviennent
 * fausses. Si le correspondant manque, on le cree — et cette creation est
 * tracee.
 */
export function SelecteurCorrespondant({
  choisi,
  onChoisir,
  erreur,
  onSaisieChange,
  onCreer,
}: {
  choisi: Correspondant | null;
  onChoisir: (correspondant: Correspondant | null) => void;
  erreur?: string;
  /**
   * Remonte ce que l'agent tape, pour que la modale de creation reprenne sa
   * recherche infructueuse au lieu de lui faire retaper le nom.
   */
  onSaisieChange?: (valeur: string) => void;
  /** Ouvre la creation. Propose la ou la recherche echoue, pas ailleurs. */
  onCreer?: () => void;
}) {
  const [saisie, setSaisie] = useState("");

  function ecrire(valeur: string) {
    setSaisie(valeur);
    onSaisieChange?.(valeur);
  }

  const recherche = useValeurDifferee(saisie);
  const { data: resultats = [], isFetching } = useQuery(correspondantsQuery(recherche));

  if (choisi) {
    return (
      <div className="mt-3 flex items-center gap-[11px] rounded-none border border-accent-trait bg-[#f8faff] p-3">
        <div className="grid size-8 flex-none place-items-center rounded-none bg-accent-voile-fort text-[10.5px] leading-none font-bold text-accent-fonce">
          {choisi.initiales}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-[12.5px] leading-none font-bold text-encre">
            {choisi.libelle}
            {choisi.sigle && (
              <span className="ml-1.5 font-semibold text-encre-faible">{choisi.sigle}</span>
            )}
          </span>
          <span className="truncate text-[11px] leading-none font-medium text-encre-faible">
            {choisi.categorie} · {choisi.nombreCourriers} courriers reçus
            {choisi.dernierCourrier && ` · dernier le ${formaterDate(choisi.dernierCourrier)}`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            onChoisir(null);
            ecrire("");
          }}
          className="flex-none text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
        >
          Changer
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3.5">
      <ChampRecherche
        valeur={saisie}
        onChange={ecrire}
        placeholder="Rechercher dans le référentiel des correspondants…"
      />

      {erreur && (
        <p className="mt-1.5 text-[10.5px] leading-none font-semibold text-danger">{erreur}</p>
      )}

      {recherche.trim().length >= 2 && (
        <ul className="mt-2 flex max-h-56 flex-col overflow-y-auto rounded-none border border-bordure">
          {resultats.map((correspondant) => (
            <li key={correspondant.id}>
              <button
                type="button"
                onClick={() => onChoisir(correspondant)}
                className="flex w-full items-center gap-2.5 border-b border-separateur px-3 py-2.5 text-left transition-colors duration-150 last:border-b-0 hover:bg-surface-douce"
              >
                <span className="grid size-7 flex-none place-items-center rounded-none bg-surface-douce text-[10px] leading-none font-bold text-encre-faible">
                  {correspondant.initiales}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs leading-none font-semibold text-encre">
                  {correspondant.libelle}
                  {/* Le sigle a cote du nom, et non a la place : l'agent a
                      cherche « MINFI », il doit voir sur quoi il a frappe. */}
                  {correspondant.sigle && (
                    <span className="ml-1.5 font-medium text-encre-tenue">
                      {correspondant.sigle}
                    </span>
                  )}
                </span>
                <span className="flex-none text-[10.5px] leading-none font-medium text-encre-tenue">
                  {correspondant.categorie}
                </span>
              </button>
            </li>
          ))}

          {resultats.length === 0 && (
            <li className="flex flex-col items-start gap-2 px-3 py-3">
              <span className="text-[11.5px] font-medium text-encre-tenue">
                {isFetching ? "Recherche…" : "Aucun correspondant ne correspond à cette recherche."}
              </span>
              {/* La creation est proposee la ou l'agent constate le manque. Le
                  bouton de l'en-tete de carte reste, mais il faut y remonter —
                  et c'est ici que la question se pose. */}
              {!isFetching && onCreer && (
                <button
                  type="button"
                  onClick={onCreer}
                  className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
                >
                  Créer « {recherche.trim()} » au référentiel
                </button>
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
