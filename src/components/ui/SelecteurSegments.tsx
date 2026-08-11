type Props<T extends string> = {
  options: readonly { valeur: T; libelle: string }[];
  valeur: T;
  onChange: (valeur: T) => void;
  libelle: string;
  /** Les segments se partagent la largeur au lieu de s'ajuster au texte. */
  pleineLargeur?: boolean;
};

/**
 * Choix exclusif entre deux a quatre options courtes.
 *
 * Prefere a une liste deroulante quand toutes les options doivent rester
 * visibles : le type de session ou le delai imparti se choisissent d'un coup
 * d'oeil, pas en ouvrant un menu.
 */
export function SelecteurSegments<T extends string>({
  options,
  valeur,
  onChange,
  libelle,
  pleineLargeur = false,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={libelle}
      className={`flex items-center overflow-hidden rounded-none border border-bordure-forte ${
        pleineLargeur ? "" : "w-fit"
      }`}
    >
      {options.map((o, i) => {
        const actif = o.valeur === valeur;
        return (
          <button
            key={o.valeur}
            type="button"
            role="radio"
            aria-checked={actif}
            onClick={() => onChange(o.valeur)}
            className={`cursor-pointer px-3.5 py-[9px] text-center text-xs leading-none font-semibold transition-colors duration-150 ${
              pleineLargeur ? "flex-1 px-1.5 text-[11.5px]" : ""
            } ${i > 0 ? "border-l border-bordure-forte" : ""} ${
              actif ? "bg-accent-voile text-accent-fonce" : "bg-surface text-encre-faible hover:bg-surface-douce"
            }`}
          >
            {o.libelle}
          </button>
        );
      })}
    </div>
  );
}
