import { Carte } from "@/components/ui/Carte";
import type { PieceJointe } from "@/types/courrier";

/** Le format donne la teinte : le PDF est le document de reference, il ressort. */
const TEINTES: Record<string, string> = {
  PDF: "bg-danger-voile text-danger",
  JPG: "bg-neutre-voile text-encre-moyenne",
  PNG: "bg-neutre-voile text-encre-moyenne",
};

export function BlocPiecesJointes({ pieces }: { pieces: PieceJointe[] }) {
  return (
    <Carte titre="Pièces jointes">
      <div className="mt-3 flex flex-col gap-[11px]">
        {pieces.map((piece) => (
          <a
            key={piece.id}
            href={`/api/pieces/${piece.id}`}
            className="flex items-center gap-2.5 rounded-none border border-bordure px-[11px] py-[9px] transition-colors duration-150 hover:bg-surface-douce"
          >
            <span
              className={`grid size-7 flex-none place-items-center rounded-none text-[8px] leading-none font-extrabold ${
                TEINTES[piece.format] ?? "bg-neutre-voile text-encre-moyenne"
              }`}
            >
              {piece.format}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                {piece.nom}
              </span>
              <span className="text-[10px] leading-none font-medium text-encre-tenue">
                {[piece.taille, piece.precision].filter(Boolean).join(" · ")}
              </span>
            </span>
          </a>
        ))}

        {pieces.length === 0 && (
          <p className="text-[11.5px] font-medium text-encre-tenue">
            Aucune pièce numérisée. Le dossier papier fait foi.
          </p>
        )}
      </div>
    </Carte>
  );
}
