import { Link } from "react-router";

export type Miette = { libelle: string; chemin?: string };

/** Chemin de retour. Le dernier element est la page courante, sans lien. */
export function FilAriane({ miettes }: { miettes: Miette[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-[7px]">
      {miettes.map((miette, i) => (
        <span key={miette.libelle} className="flex items-center gap-[7px]">
          {i > 0 && <span className="text-[11px] leading-none font-semibold text-bordure-champ">/</span>}
          {miette.chemin ? (
            <Link
              to={miette.chemin}
              className="text-[11px] leading-none font-semibold text-accent hover:text-accent-fonce"
            >
              {miette.libelle}
            </Link>
          ) : (
            <span className="text-[11px] leading-none font-semibold text-encre-faible">
              {miette.libelle}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
