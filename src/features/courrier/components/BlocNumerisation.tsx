import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Icone } from "@/components/ui/Icone";

export interface PageNumerisee {
  id: string;
  libelle: string;
}

/**
 * Pieces jointes du courrier.
 *
 * L'institution travaille en mode hybride : le papier continue de circuler et
 * la numerisation ne le remplace pas. D'ou la mention rappelee sous les
 * vignettes — sans elle, un agent croira que le document original peut rester
 * au service courrier.
 */
export function BlocNumerisation({
  pages,
  onNumeriser,
  onImporter,
  onReordonner,
}: {
  pages: PageNumerisee[];
  onNumeriser?: () => void;
  onImporter?: () => void;
  onReordonner?: () => void;
}) {
  return (
    <Carte
      titre="Numérisation"
      aDroite={
        <span className="text-[11px] leading-none font-medium text-encre-tenue">
          {pages.length === 0
            ? "Aucune page capturée"
            : `${pages.length} page${pages.length > 1 ? "s" : ""} capturée${pages.length > 1 ? "s" : ""}`}
        </span>
      }
    >
      <div className="mt-3.5 grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-[11px]">
        {pages.map((page) => (
          <div
            key={page.id}
            className="flex flex-col gap-1.5 rounded-none border border-bordure bg-neutre-voile p-[9px]"
          >
            <div className="flex flex-col gap-1 rounded-none border border-bordure bg-surface p-[9px]">
              <div className="h-[3px] w-1/2 rounded-none bg-accent-voile-fort" />
              <div className="mt-1 h-[3px] w-full rounded-none bg-inerte" />
              <div className="h-[3px] w-[88%] rounded-none bg-inerte" />
              <div className="h-[3px] w-[94%] rounded-none bg-inerte" />
              <div className="h-[3px] w-2/5 rounded-none bg-inerte" />
            </div>
            <span className="text-center text-[10px] leading-none font-semibold text-encre-faible">
              {page.libelle}
            </span>
          </div>
        ))}

        <button
          type="button"
          onClick={onNumeriser}
          className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-none border border-dashed border-bordure-champ px-[9px] py-4 transition-colors duration-150 hover:bg-neutre-voile"
        >
          <Icone nom="numeriser" taille={18} epaisseur={1.6} className="text-encre-tenue" />
          <span className="text-center text-[10.5px] leading-[1.3] font-semibold text-encre-faible">
            Numériser
            <br />
            une page
          </span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Bouton onClick={onImporter}>Importer un fichier</Bouton>
        <Bouton onClick={onReordonner} disabled={pages.length < 2}>
          Réordonner
        </Bouton>
        <span className="text-[11px] leading-[1.4] font-medium text-encre-tenue">
          Le document original est remis au coursier avec le bordereau.
        </span>
      </div>
    </Carte>
  );
}
